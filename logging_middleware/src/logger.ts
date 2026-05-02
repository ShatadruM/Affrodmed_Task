import axios from "axios";
import { Level, LogPayload, LogResponse, Package, Stack } from "./types";

const LOG_API_URL = "http://20.207.122.201/evaluation-service/logs";

// Valid values for runtime validation
const VALID_STACKS: Stack[] = ["backend", "frontend"];
const VALID_LEVELS: Level[] = ["debug", "info", "warn", "error", "fatal"];
const VALID_PACKAGES: Package[] = [
  // Backend
  "cache", "controller", "cron_job", "db", "domain",
  "handler", "repository", "route", "service",
  // Shared
  "auth", "config", "middleware", "utils",
  // Frontend
  "api", "component", "hook", "page", "state", "style",
];

function getAuthToken(): string {
  const token = process.env.LOG_API_TOKEN;
  if (!token) {
    throw new Error(
      "[LogMiddleware] LOG_API_TOKEN is not set in environment variables."
    );
  }
  return token;
}

function validate(stack: Stack, level: Level, pkg: Package): void {
  if (!VALID_STACKS.includes(stack)) {
    throw new Error(`[LogMiddleware] Invalid stack: "${stack}". Must be one of: ${VALID_STACKS.join(", ")}`);
  }
  if (!VALID_LEVELS.includes(level)) {
    throw new Error(`[LogMiddleware] Invalid level: "${level}". Must be one of: ${VALID_LEVELS.join(", ")}`);
  }
  if (!VALID_PACKAGES.includes(pkg)) {
    throw new Error(`[LogMiddleware] Invalid package: "${pkg}". Must be one of: ${VALID_PACKAGES.join(", ")}`);
  }
}

/**
 * Log — sends a structured log entry to the evaluation log server.
 *
 * @param stack   - "backend" | "frontend"
 * @param level   - "debug" | "info" | "warn" | "error" | "fatal"
 * @param pkg     - package name (e.g. "handler", "db", "service")
 * @param message - descriptive log message
 *
 * @example
 * await Log("backend", "error", "handler", "Received string, expected bool");
 * await Log("backend", "fatal", "db", "Critical database connection failure.");
 */
export async function Log(
  stack: Stack,
  level: Level,
  pkg: Package,
  message: string
): Promise<LogResponse | null> {
  try {
    validate(stack, level, pkg);

    const payload: LogPayload = {
      stack,
      level,
      package: pkg,
      message,
    };

    const token = getAuthToken();

    const response = await axios.post<LogResponse>(LOG_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: unknown) {
    // Log failures should NEVER crash the application
    if (axios.isAxiosError(error)) {
      console.error(
        `[LogMiddleware] API error (${error.response?.status}):`,
        error.response?.data ?? error.message
      );
    } else if (error instanceof Error) {
      console.error("[LogMiddleware] Error:", error.message);
    } else {
      console.error("[LogMiddleware] Unknown error while logging.");
    }
    return null;
  }
}