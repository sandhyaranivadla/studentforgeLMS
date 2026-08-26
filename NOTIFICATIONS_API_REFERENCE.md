# Notifications API Reference

## Base URL
```
http://localhost:4000/notifications
```

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## REST Endpoints

### 1. GET /notifications
Fetch paginated notifications for the authenticated user.

**Query Parameters**:
| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| page | number | 1 | N/A | Page number (1-indexed) |
| limit | number | 20 | 100 | Items per page |

**Request**:
```bash
curl -X GET "http://localhost:4000/notifications?page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "notif-uuid-1",
      "type": "ASSIGNMENT_SUBMITTED",
      "title": "New submission: Math Homework",
      "message": "John Doe submitted \"Math Homework\"",
      "read": false,
      "readAt": null,
      "courseId": "course-uuid",
      "relatedEntityId": "submission-uuid",
      "relatedEntityType": "ASSIGNMENT_SUBMISSION",
      "actionUrl": "/dashboard/instructor/assignments/123/submissions",
      "createdAt": "2024-08-25T10:30:00.000Z",
      "updatedAt": "2024-08-25T10:30:00.000Z"
    },
    {
      "id": "notif-uuid-2",
      "type": "ANNOUNCEMENT_PUBLISHED",
      "title": "New announcement: Course Update",
      "message": "Course Update: Check the latest materials...",
      "read": true,
      "readAt": "2024-08-25T11:00:00.000Z",
      "courseId": "course-uuid",
      "relatedEntityId": "announcement-uuid",
      "relatedEntityType": "ANNOUNCEMENT",
      "actionUrl": "/dashboard/student/announcements/ann-uuid",
      "createdAt": "2024-08-24T15:20:00.000Z",
      "updatedAt": "2024-08-25T11:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing JWT token
- 400 Bad Request: Invalid pagination parameters

---

### 2. GET /notifications/unread-count
Get the count of unread notifications for the authenticated user.

**Request**:
```bash
curl -X GET "http://localhost:4000/notifications/unread-count" \
  -H "Authorization: Bearer <token>"
```

**Response** (200 OK):
```json
{
  "unreadCount": 5
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing JWT token

---

### 3. PATCH /notifications/:id/read
Mark a single notification as read.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Notification ID (UUID) |

**Request**:
```bash
curl -X PATCH "http://localhost:4000/notifications/notif-uuid/read" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Response** (200 OK):
```json
{
  "id": "notif-uuid",
  "type": "ASSIGNMENT_SUBMITTED",
  "title": "New submission: Math Homework",
  "message": "John Doe submitted \"Math Homework\"",
  "read": true,
  "readAt": "2024-08-25T11:30:00.000Z",
  "courseId": "course-uuid",
  "relatedEntityId": "submission-uuid",
  "relatedEntityType": "ASSIGNMENT_SUBMISSION",
  "actionUrl": "/dashboard/instructor/assignments/123/submissions",
  "createdAt": "2024-08-25T10:30:00.000Z",
  "updatedAt": "2024-08-25T11:30:00.000Z"
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing JWT token
- 403 Forbidden: Trying to mark another user's notification
- 404 Not Found: Notification ID doesn't exist

---

### 4. PATCH /notifications/read-all
Mark all unread notifications as read for the authenticated user.

**Request**:
```bash
curl -X PATCH "http://localhost:4000/notifications/read-all" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Response** (200 OK):
```json
{
  "updated": 5
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing JWT token

---

### 5. DELETE /notifications/:id
Delete a single notification.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Notification ID (UUID) |

**Request**:
```bash
curl -X DELETE "http://localhost:4000/notifications/notif-uuid" \
  -H "Authorization: Bearer <token>"
```

**Response** (200 OK):
```json
{
  "id": "notif-uuid",
  "type": "ASSIGNMENT_SUBMITTED",
  "title": "New submission: Math Homework",
  "message": "John Doe submitted \"Math Homework\"",
  "read": false,
  "readAt": null,
  "courseId": "course-uuid",
  "relatedEntityId": "submission-uuid",
  "relatedEntityType": "ASSIGNMENT_SUBMISSION",
  "actionUrl": "/dashboard/instructor/assignments/123/submissions",
  "createdAt": "2024-08-25T10:30:00.000Z",
  "updatedAt": "2024-08-25T10:30:00.000Z"
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing JWT token
- 403 Forbidden: Trying to delete another user's notification
- 404 Not Found: Notification ID doesn't exist

---

### 6. DELETE /notifications
Delete all notifications for the authenticated user.

**Request**:
```bash
curl -X DELETE "http://localhost:4000/notifications" \
  -H "Authorization: Bearer <token>"
```

**Response** (200 OK):
```json
{
  "deleted": 12
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing JWT token

---

## Socket.io Events

### Connection
Connect to the notifications namespace with JWT authentication.

**Client Code** (useNotifications hook handles this):
```typescript
const socket = io('http://localhost:4000/notifications', {
  auth: { token: '<jwt-token>' },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});
```

**Connection Lifecycle**:
1. Client connects with token in auth
2. Gateway validates JWT
3. User added to room: `user_${userId}`
4. `connect` event fired
5. Client can now receive notifications

---

### Event: notification:new
Real-time notification delivery when a new notification is created.

**Received Event**:
```typescript
socket.on('notification:new', (notification) => {
  // {
  //   "id": "notif-uuid",
  //   "type": "ASSIGNMENT_SUBMITTED",
  //   "title": "New submission: Math Homework",
  //   "message": "John Doe submitted \"Math Homework\"",
  //   "read": false,
  //   "readAt": null,
  //   "courseId": "course-uuid",
  //   "relatedEntityId": "submission-uuid",
  //   "relatedEntityType": "ASSIGNMENT_SUBMISSION",
  //   "actionUrl": "/dashboard/instructor/assignments/123/submissions",
  //   "createdAt": "2024-08-25T10:30:00.000Z",
  //   "updatedAt": "2024-08-25T10:30:00.000Z"
  // }
  console.log('New notification:', notification);
});
```

**Triggered By**:
- NotificationsService.createNotification()
- Gateway.emitToUser()

---

### Event: unread-count:update
Real-time unread count update when user marks notifications as read/deleted.

**Received Event**:
```typescript
socket.on('unread-count:update', (data) => {
  // {
  //   "unreadCount": 5
  // }
  console.log('Unread count:', data.unreadCount);
});
```

**Triggered By**:
- markAsRead() → Gateway.emitUnreadCountUpdate()
- markAllAsRead() → Gateway.emitUnreadCountUpdate()
- deleteNotification() → Gateway.emitUnreadCountUpdate()
- deleteAllNotifications() → Gateway.emitUnreadCountUpdate()

---

### Event: connect
Connection successfully established.

```typescript
socket.on('connect', () => {
  console.log('Connected to notifications server');
  // Automatically joined room: user_${userId}
});
```

---

### Event: disconnect
Connection lost (temporary or permanent).

```typescript
socket.on('disconnect', () => {
  console.log('Disconnected from notifications server');
  // Client will auto-reconnect (default: up to 5 times)
  // Notifications remain in database for retrieval on reconnect
});
```

---

### Event: connect_error
Connection error (usually auth failure).

```typescript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Possible causes:
  // - Invalid JWT token
  // - Token expired
  // - Server unavailable
});
```

---

## Notification Types

| Type | Triggered | Recipient | Example |
|------|-----------|-----------|---------|
| ASSIGNMENT_SUBMITTED | Student submits assignment | Instructor | "John submitted Math Homework" |
| ASSIGNMENT_GRADED | Instructor grades submission | Student | "Your Math Homework has been graded: 85/100" |
| ASSIGNMENT_CREATED | Instructor creates assignment | Students (on course view) | "New assignment posted: Math Homework" |
| ANNOUNCEMENT_PUBLISHED | Instructor publishes announcement | Enrolled students | "New announcement: Course Update" |
| LIVE_SESSION_SCHEDULED | Instructor schedules session | Enrolled students | "Live session scheduled: 2024-08-26 3:00 PM" |
| LIVE_SESSION_UPDATED | Instructor updates session | Enrolled students | "Live session updated: Time changed to 4:00 PM" |
| LIVE_SESSION_CANCELLED | Instructor cancels session | Enrolled students | "Live session cancelled: Math Live Class" |
| ENROLLMENT_CONFIRMED | Student enrolls | Student | "You are now enrolled in Introduction to Mathematics" |
| COURSE_PUBLISHED | Instructor publishes course | Admin/Teacher | "Course published: Introduction to Mathematics" |
| QUIZ_PUBLISHED | Instructor publishes quiz | Enrolled students | "New quiz available: Chapter 1 Quiz" |

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (invalid/missing JWT) |
| 403 | Forbidden (trying to access another user's data) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding:
- 10 requests/second per user
- 100 notifications/day per user
- 1000 concurrent Socket.io connections per server

---

## Examples

### Example 1: Fetch Unread Notifications

```typescript
async function getUnreadNotifications() {
  const response = await fetch('http://localhost:4000/notifications?page=1&limit=20', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const { data, pagination } = await response.json();
  const unread = data.filter(n => !n.read);
  
  console.log(`${unread.length} unread notifications`);
  return unread;
}
```

### Example 2: Real-Time Notification Setup

```typescript
function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const socket = io('http://localhost:4000/notifications', {
      auth: { token: localStorage.getItem('jwt') },
    });
    
    socket.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });
    
    socket.on('unread-count:update', ({ unreadCount }) => {
      // Update badge
      document.title = `(${unreadCount}) Notifications`;
    });
    
    return () => socket.disconnect();
  }, []);
  
  return notifications;
}
```

### Example 3: Mark All as Read and Delete All

```typescript
async function clearAllNotifications() {
  // Mark all as read
  await fetch('http://localhost:4000/notifications/read-all', {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  // Delete all
  const response = await fetch('http://localhost:4000/notifications', {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  const { deleted } = await response.json();
  console.log(`Deleted ${deleted} notifications`);
}
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-08-25 | Initial release with 6 endpoints and Socket.io support |

