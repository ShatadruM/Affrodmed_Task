# Stage 1

## Campus Notification Platform — REST API Design & Contract

---

## Overview

This document defines the REST API contract for the Campus Notification Platform. The platform delivers real-time updates to students across three core domains: **Placements**, **Events**, and **Results**. This contract is intended for consumption by the Frontend team.

---

## Base URL

```
https://api.campus-notify.com/v1
```

---

## Authentication

All endpoints are protected. The client must include a Bearer token in every request.

**Header (required on all endpoints):**

```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

Token is obtained via the login endpoint and expires in 24 hours.

---

## Core Actions Supported

| Action | Description |
|---|---|
| Authenticate | Login / logout |
| Fetch Notifications | Get all or filtered notifications for logged-in user |
| Mark as Read | Mark one or all notifications as read |
| Get Notification Detail | Fetch a single notification's full content |
| Manage Preferences | Subscribe/unsubscribe from notification categories |
| Real-Time Updates | Subscribe to live notification stream via SSE |

---

## Endpoints

---

### 1. Authentication

#### `POST /auth/login`

Authenticates a student and returns a JWT token.

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "student@campus.edu",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2025-05-03T10:00:00.000Z",
    "student": {
      "id": "stu_9f3a1c2b",
      "name": "Rohan Mehta",
      "email": "student@campus.edu",
      "department": "Computer Science",
      "year": 3
    }
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect."
  }
}
```

---

#### `POST /auth/logout`

Invalidates the current session token.

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

### 2. Notifications

#### `GET /notifications`

Returns a paginated list of notifications for the authenticated student. Supports filtering by category and read status.

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Accept": "application/json"
}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `category` | string | No | Filter by `placement`, `event`, or `result` |
| `isRead` | boolean | No | Filter by read status (`true` / `false`) |
| `page` | integer | No | Page number (default: `1`) |
| `limit` | integer | No | Results per page (default: `20`, max: `100`) |

**Example Request:**
```
GET /notifications?category=placement&isRead=false&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_a1b2c3d4",
        "category": "placement",
        "title": "Infosys Campus Drive — Registration Open",
        "summary": "Infosys is visiting on 10th May. Eligible branches: CSE, ECE, IT.",
        "isRead": false,
        "createdAt": "2025-05-01T09:30:00.000Z"
      },
      {
        "id": "notif_e5f6g7h8",
        "category": "result",
        "title": "Semester 5 Results Published",
        "summary": "Results for November 2024 examinations are now available.",
        "isRead": false,
        "createdAt": "2025-04-30T14:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 4,
      "totalCount": 73,
      "limit": 20
    }
  }
}
```

---

#### `GET /notifications/:notificationId`

Returns the full details of a single notification.

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Accept": "application/json"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "notif_a1b2c3d4",
    "category": "placement",
    "title": "Infosys Campus Drive — Registration Open",
    "body": "Infosys Limited is conducting an on-campus recruitment drive on 10th May 2025. Students from CSE, ECE, and IT with a CGPA above 7.0 are eligible. Registration closes on 6th May. Report to the Placement Cell with your updated resume.",
    "attachments": [
      {
        "name": "Infosys_Drive_Details.pdf",
        "url": "https://cdn.campus-notify.com/files/infosys_drive_may2025.pdf"
      }
    ],
    "isRead": false,
    "createdAt": "2025-05-01T09:30:00.000Z",
    "expiresAt": "2025-05-06T23:59:59.000Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "NOTIFICATION_NOT_FOUND",
    "message": "No notification found with the given ID."
  }
}
```

---

#### `PATCH /notifications/:notificationId/read`

Marks a single notification as read.

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "notif_a1b2c3d4",
    "isRead": true,
    "readAt": "2025-05-02T11:15:00.000Z"
  }
}
```

---

#### `PATCH /notifications/read-all`

Marks all unread notifications for the authenticated student as read.

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "updatedCount": 12,
    "message": "All notifications marked as read."
  }
}
```

---

### 3. Notification Preferences

#### `GET /notifications/preferences`

Returns the student's current notification subscription preferences.

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Accept": "application/json"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "placement": true,
      "event": true,
      "result": true
    }
  }
}
```

---

#### `PUT /notifications/preferences`

Updates the student's notification category subscriptions.

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "placement": true,
  "event": false,
  "result": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "placement": true,
      "event": false,
      "result": true
    },
    "message": "Preferences updated successfully."
  }
}
```

---

## Real-Time Notifications

Real-time delivery is implemented using **Server-Sent Events (SSE)**. This is a lightweight, unidirectional approach — the server pushes events to the client over a persistent HTTP connection, which is ideal for notification streams.

### Why SSE over WebSockets?

- Notifications are server-to-client only — no need for bidirectional communication.
- SSE works over standard HTTP/1.1 with automatic reconnection built into the browser.
- Simpler to implement and scale compared to WebSockets for this use case.

---

#### `GET /notifications/stream`

Opens a persistent SSE connection for the authenticated student. The server pushes new notifications in real time as they are created.

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Accept": "text/event-stream",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive"
}
```

**Server-Sent Event Format:**

Each event follows the SSE specification:

```
id: notif_x9y8z7w6
event: new_notification
data: {"id":"notif_x9y8z7w6","category":"placement","title":"TCS NQT Registration Open","summary":"TCS NQT 2025 registrations are now live. Last date: 15th May.","createdAt":"2025-05-02T12:00:00.000Z"}
```

**Event Types:**

| Event | Trigger |
|---|---|
| `new_notification` | A new notification is dispatched to the student |
| `notification_updated` | An existing notification's content is edited |
| `ping` | Heartbeat sent every 30 seconds to keep the connection alive |

**Ping Event (keepalive):**
```
event: ping
data: {"timestamp":"2025-05-02T12:00:30.000Z"}
```

**Frontend Integration (JavaScript):**
```javascript
const stream = new EventSource("/v1/notifications/stream", {
  headers: { Authorization: `Bearer ${token}` }
});

stream.addEventListener("new_notification", (event) => {
  const notification = JSON.parse(event.data);
  displayNotification(notification);
});

stream.addEventListener("ping", () => {
  console.log("Connection alive.");
});

stream.onerror = () => {
  console.warn("SSE connection lost. Reconnecting...");
};
```

---

## Notification Categories & Schema

| Category | Description | Example |
|---|---|---|
| `placement` | Company drives, registration deadlines, interview schedules | "Infosys drive on 10th May" |
| `event` | Campus fests, workshops, seminars, deadlines | "Tech Fest registrations close tomorrow" |
| `result` | Exam results, grade releases, re-evaluation updates | "Sem 5 results now live" |

---

## Standard Error Schema

All error responses follow a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description of what went wrong."
  }
}
```

**Common Error Codes:**

| HTTP Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body or params are invalid |
| 401 | `UNAUTHORIZED` | Missing or expired token |
| 403 | `FORBIDDEN` | Token valid but access denied |
| 404 | `NOTIFICATION_NOT_FOUND` | Resource does not exist |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server failure |

---

## API Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Authenticate student, get token |
| `POST` | `/auth/logout` | Invalidate session |
| `GET` | `/notifications` | List notifications (filterable) |
| `GET` | `/notifications/:id` | Get full notification detail |
| `PATCH` | `/notifications/:id/read` | Mark single notification as read |
| `PATCH` | `/notifications/read-all` | Mark all notifications as read |
| `GET` | `/notifications/preferences` | Get category preferences |
| `PUT` | `/notifications/preferences` | Update category preferences |
| `GET` | `/notifications/stream` | SSE stream for real-time updates |

# Stage 2
 
## Persistent Storage — Database Design
 
---
 
## Database Choice: PostgreSQL
 
### Recommendation
 
**PostgreSQL** is recommended as the primary persistent store for the Campus Notification Platform.
 
### Justification
 
| Factor | Reasoning |
|---|---|
| **Structured, relational data** | Students, notifications, preferences, and read-receipts are naturally relational with clear foreign key relationships |
| **ACID compliance** | Critical for read-receipt tracking — a notification must never be incorrectly marked as read or lost |
| **Rich indexing** | Supports composite, partial, and GIN indexes — essential for filtering by `category`, `isRead`, and `studentId` at scale |
| **JSONB support** | Attachments and metadata can be stored as JSONB without needing a separate schema, keeping flexibility |
| **Mature ecosystem** | Well-supported with TypeScript ORMs (Prisma, TypeORM) and production-proven at large scale |
 
### Supporting Layer: Redis
 
**Redis** is used alongside PostgreSQL as a caching and pub/sub layer:
- Cache frequently fetched notification lists (invalidated on new notification insert)
- Power the SSE real-time stream via Redis Pub/Sub — when a new notification is inserted, the backend publishes to a Redis channel, and all active SSE connections for that student receive the event instantly
---
 
## Database Schema
 
### Table: `students`
 
Stores authenticated student accounts.
 
```sql
CREATE TABLE students (
  id           VARCHAR(20) PRIMARY KEY,          -- e.g. "stu_9f3a1c2b"
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  department   VARCHAR(100),
  year         SMALLINT CHECK (year BETWEEN 1 AND 5),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
 
---
 
### Table: `notifications`
 
Stores all notifications dispatched by the admin/system.
 
```sql
CREATE TABLE notifications (
  id          VARCHAR(20) PRIMARY KEY,            -- e.g. "notif_a1b2c3d4"
  category    VARCHAR(20) NOT NULL
                CHECK (category IN ('placement', 'event', 'result')),
  title       VARCHAR(255) NOT NULL,
  summary     TEXT NOT NULL,
  body        TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',                 -- [{ "name": "...", "url": "..." }]
  expires_at  TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
 
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```
 
---
 
### Table: `student_notifications`
 
Junction table — tracks which notifications are targeted to which students and their read status.
 
```sql
CREATE TABLE student_notifications (
  id              SERIAL PRIMARY KEY,
  student_id      VARCHAR(20) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  notification_id VARCHAR(20) NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 
  CONSTRAINT uq_student_notification UNIQUE (student_id, notification_id)
);
 
CREATE INDEX idx_sn_student_id       ON student_notifications(student_id);
CREATE INDEX idx_sn_is_read          ON student_notifications(student_id, is_read);
CREATE INDEX idx_sn_created_at       ON student_notifications(student_id, created_at DESC);
```
 
---
 
### Table: `notification_preferences`
 
Stores each student's category subscription settings.
 
```sql
CREATE TABLE notification_preferences (
  student_id  VARCHAR(20) PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  placement   BOOLEAN NOT NULL DEFAULT TRUE,
  event       BOOLEAN NOT NULL DEFAULT TRUE,
  result      BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
 
---
 
### Table: `sessions`
 
Tracks active JWT sessions to support logout/invalidation.
 
```sql
CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  VARCHAR(20) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
 
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
```
 
---
 
## Schema Diagram (Entity Relationships)
 
```
students ──────────────────────────────┐
  │                                    │
  ├──< student_notifications >──── notifications
  │
  ├──── notification_preferences
  │
  └──── sessions
```
 
---
 
## SQL Queries for Stage 1 REST APIs
 
---
 
### `POST /auth/login`
 
Fetch student by email to verify credentials:
 
```sql
SELECT id, name, email, password_hash, department, year
FROM students
WHERE email = $1;
```
 
Insert a new session on successful login:
 
```sql
INSERT INTO sessions (student_id, token_hash, expires_at)
VALUES ($1, $2, NOW() + INTERVAL '24 hours')
RETURNING id;
```
 
---
 
### `POST /auth/logout`
 
Invalidate the session by deleting it:
 
```sql
DELETE FROM sessions
WHERE token_hash = $1;
```
 
---
 
### `GET /notifications` (with filters + pagination)
 
Fetch paginated notifications for a student, optionally filtered by category and read status:
 
```sql
SELECT
  n.id,
  n.category,
  n.title,
  n.summary,
  sn.is_read,
  sn.created_at
FROM student_notifications sn
JOIN notifications n ON n.id = sn.notification_id
WHERE sn.student_id = $1
  AND ($2::TEXT IS NULL OR n.category = $2)          -- optional category filter
  AND ($3::BOOLEAN IS NULL OR sn.is_read = $3)       -- optional isRead filter
  AND (n.expires_at IS NULL OR n.expires_at > NOW()) -- exclude expired
ORDER BY sn.created_at DESC
LIMIT $4 OFFSET $5;
```
 
Corresponding count query for pagination metadata:
 
```sql
SELECT COUNT(*)
FROM student_notifications sn
JOIN notifications n ON n.id = sn.notification_id
WHERE sn.student_id = $1
  AND ($2::TEXT IS NULL OR n.category = $2)
  AND ($3::BOOLEAN IS NULL OR sn.is_read = $3)
  AND (n.expires_at IS NULL OR n.expires_at > NOW());
```
 
---
 
### `GET /notifications/:id`
 
Fetch full details of a single notification for a student:
 
```sql
SELECT
  n.id,
  n.category,
  n.title,
  n.summary,
  n.body,
  n.attachments,
  n.expires_at,
  n.created_at,
  sn.is_read,
  sn.read_at
FROM student_notifications sn
JOIN notifications n ON n.id = sn.notification_id
WHERE sn.student_id = $1
  AND sn.notification_id = $2;
```
 
---
 
### `PATCH /notifications/:id/read`
 
Mark a single notification as read:
 
```sql
UPDATE student_notifications
SET
  is_read = TRUE,
  read_at = NOW()
WHERE student_id = $1
  AND notification_id = $2
  AND is_read = FALSE
RETURNING notification_id, is_read, read_at;
```
 
---
 
### `PATCH /notifications/read-all`
 
Mark all unread notifications for a student as read:
 
```sql
UPDATE student_notifications
SET
  is_read = TRUE,
  read_at = NOW()
WHERE student_id = $1
  AND is_read = FALSE;
```
 
Return the count of updated rows via the ORM or `GET DIAGNOSTICS updated_count = ROW_COUNT`.
 
---
 
### `GET /notifications/preferences`
 
Fetch a student's preferences:
 
```sql
SELECT placement, event, result
FROM notification_preferences
WHERE student_id = $1;
```
 
---
 
### `PUT /notifications/preferences`
 
Upsert preferences (create if not exists, update if exists):
 
```sql
INSERT INTO notification_preferences (student_id, placement, event, result, updated_at)
VALUES ($1, $2, $3, $4, NOW())
ON CONFLICT (student_id)
DO UPDATE SET
  placement  = EXCLUDED.placement,
  event      = EXCLUDED.event,
  result     = EXCLUDED.result,
  updated_at = NOW()
RETURNING placement, event, result;
```
 
---
 
## Scalability Problems & Solutions
 
As the student population and notification volume grow, the following problems will arise:
 
---
 
### Problem 1: `student_notifications` Table Grows Too Large
 
**Cause:** Every notification creates a row per student. With 10,000 students and 50 notifications/day, this table grows by 500,000 rows/day.
 
**Solution:**
- Add a **composite index** on `(student_id, created_at DESC)` — already defined in the schema — so pagination queries stay fast regardless of table size.
- Implement **table partitioning** by `created_at` (monthly partitions), so older data is isolated and can be archived without affecting active queries.
- Run a scheduled job to **archive or delete** notifications older than a configurable retention period (e.g. 90 days).
```sql
-- Example: partition student_notifications by month
CREATE TABLE student_notifications_2025_05
  PARTITION OF student_notifications
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
```
 
---
 
### Problem 2: Slow Filtered Queries at Scale
 
**Cause:** Filtering by `category` + `is_read` + `student_id` across millions of rows causes sequential scans.
 
**Solution:**
- Add a **partial index** on unread notifications only — the most common query pattern:
```sql
CREATE INDEX idx_sn_unread
ON student_notifications(student_id, created_at DESC)
WHERE is_read = FALSE;
```
 
- This index is much smaller than a full index and dramatically speeds up the default notification feed query.
---
 
### Problem 3: SSE Connections Don't Scale Horizontally
 
**Cause:** SSE connections are stateful and held open on a single server. When multiple backend instances run behind a load balancer, a new notification published by Instance A won't reach students connected to Instance B.
 
**Solution:**
- Use **Redis Pub/Sub** as a message broker between instances. When a notification is created, publish to a Redis channel keyed by `student_id`. All server instances subscribe to Redis and push events to their local SSE connections.
```
[Admin creates notification]
        ↓
[Backend Instance A] → PUBLISH to Redis channel "notify:stu_9f3a1c2b"
        ↓
[All Backend Instances] ← SUBSCRIBE → push SSE event to connected student
```
 
---
 
### Problem 4: Database Write Bottleneck on Bulk Notification Dispatch
 
**Cause:** Broadcasting a notification to 10,000 students requires 10,000 INSERT rows into `student_notifications` synchronously.
 
**Solution:**
- Offload bulk inserts to a **background job queue** (e.g. BullMQ with Redis). The API call returns immediately; the worker processes the inserts in batches asynchronously.
- Use PostgreSQL's `INSERT ... SELECT` to batch-insert in a single query:
```sql
INSERT INTO student_notifications (student_id, notification_id)
SELECT s.id, $1
FROM students s
JOIN notification_preferences np ON np.student_id = s.id
WHERE
  ($2 = 'placement' AND np.placement = TRUE) OR
  ($2 = 'event'     AND np.event = TRUE)     OR
  ($2 = 'result'    AND np.result = TRUE);
```
 
This single query inserts only for students who have opted in to the category, respecting preferences at the point of dispatch.
 
---
 
### Problem 5: Cache Invalidation
 
**Cause:** Caching notification lists in Redis speeds up reads, but stale cache is served after new notifications arrive or read status changes.
 
**Solution:**
- Use **cache-aside pattern**: on write (new notification, mark as read), explicitly delete the affected student's cached list key.
- Set a **short TTL** (e.g. 60 seconds) as a fallback safety net so stale data is never served for more than 1 minute even if invalidation is missed.
```
Cache key pattern: "notif_list:{student_id}:{category}:{isRead}:{page}"
Invalidate on:     INSERT into student_notifications for student_id
                   UPDATE student_notifications SET is_read = TRUE
```