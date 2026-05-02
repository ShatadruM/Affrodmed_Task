import axios from "axios";
import * as dotenv from "dotenv";
import { Log } from "../../logging_middleware/src/logger";
dotenv.config();

// ── Types ──────────────────────────────────────────────────────────────────

type NotificationType = "Placement" | "Result" | "Event";

interface RawNotification {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string; // e.g. "2026-04-22 17:51:30"
}

interface ScoredNotification extends RawNotification {
  typeWeight: number;
  recencyScore: number;
  finalScore: number;
}

// ── Config ─────────────────────────────────────────────────────────────────

const API_URL = "http://20.207.122.201/evaluation-service/notifications";
const TOKEN = process.env.LOG_API_TOKEN;

const TYPE_WEIGHT: Record<NotificationType, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

const WEIGHT_ALPHA = 0.7;  // type weight contribution
const RECENCY_ALPHA = 0.3; // recency contribution

// ── Fetch ──────────────────────────────────────────────────────────────────

async function fetchNotifications(): Promise<RawNotification[]> {
  await Log("backend", "info", "service", "Fetching notifications from evaluation API");

  const response = await axios.get<{ notifications: RawNotification[] }>(
    API_URL,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  const notifications = response.data.notifications;
  await Log(
    "backend",
    "info",
    "service",
    `Successfully fetched ${notifications.length} notifications from API`
  );

  return notifications;
}

// ── Scoring ────────────────────────────────────────────────────────────────

function scoreNotifications(notifications: RawNotification[]): ScoredNotification[] {
  const timestamps = notifications.map((n) => new Date(n.Timestamp).getTime());

  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  const tsRange = maxTs - minTs || 1;

  return notifications.map((n, i) => {
    const typeWeight = TYPE_WEIGHT[n.Type] ?? 1;
    const recencyScore = (timestamps[i] - minTs) / tsRange;
    const finalScore = typeWeight * WEIGHT_ALPHA + recencyScore * RECENCY_ALPHA;

    return { ...n, typeWeight, recencyScore, finalScore };
  });
}

// ── Min-Heap (keeps top N highest scores) ─────────────────────────────────

class MinHeap {
  private heap: ScoredNotification[] = [];
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  private parentIdx(i: number) { return Math.floor((i - 1) / 2); }
  private leftIdx(i: number)   { return 2 * i + 1; }
  private rightIdx(i: number)  { return 2 * i + 2; }

  private swap(i: number, j: number) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const p = this.parentIdx(i);
      if (this.heap[p].finalScore <= this.heap[i].finalScore) break;
      this.swap(i, p);
      i = p;
    }
  }

  private bubbleDown(i: number) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = this.leftIdx(i);
      const r = this.rightIdx(i);
      if (l < n && this.heap[l].finalScore < this.heap[smallest].finalScore) smallest = l;
      if (r < n && this.heap[r].finalScore < this.heap[smallest].finalScore) smallest = r;
      if (smallest === i) break;
      this.swap(i, smallest);
      i = smallest;
    }
  }

  insert(item: ScoredNotification) {
    if (this.heap.length < this.capacity) {
      this.heap.push(item);
      this.bubbleUp(this.heap.length - 1);
    } else if (item.finalScore > this.heap[0].finalScore) {
      this.heap[0] = item;
      this.bubbleDown(0);
    }
  }

  getTopN(): ScoredNotification[] {
    return [...this.heap].sort((a, b) => b.finalScore - a.finalScore);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function getTopNNotifications(n: number = 10): Promise<void> {
  await Log("backend", "info", "service", `Priority inbox requested for top ${n} notifications`);

  try {
    const raw = await fetchNotifications();

    if (raw.length === 0) {
      await Log("backend", "warn", "service", "No notifications returned from API — inbox will be empty");
      console.log("No notifications found.");
      return;
    }

    await Log("backend", "debug", "service", `Scoring ${raw.length} notifications using type weight (70%) and recency (30%)`);

    const scored = scoreNotifications(raw);
    const heap = new MinHeap(n);

    for (const notif of scored) {
      heap.insert(notif);
    }

    const topN = heap.getTopN();

    await Log(
      "backend",
      "info",
      "service",
      `Top ${topN.length} notifications selected. Highest score: ${topN[0]?.finalScore.toFixed(4)}, Lowest in top N: ${topN[topN.length - 1]?.finalScore.toFixed(4)}`
    );

    console.log(`\n====== TOP ${n} PRIORITY NOTIFICATIONS ======\n`);
    topN.forEach((item, idx) => {
      console.log(`#${idx + 1}`);
      console.log(`  ID        : ${item.ID}`);
      console.log(`  Type      : ${item.Type}`);
      console.log(`  Message   : ${item.Message}`);
      console.log(`  Timestamp : ${item.Timestamp}`);
      console.log(`  Score     : ${item.finalScore.toFixed(4)}  (type weight: ${item.typeWeight}, recency: ${item.recencyScore.toFixed(4)})`);
      console.log();
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await Log("backend", "error", "service", `Failed to build priority inbox: ${message}`);
    console.error("Error fetching priority notifications:", message);
    process.exit(1);
  }
}

getTopNNotifications(10);