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