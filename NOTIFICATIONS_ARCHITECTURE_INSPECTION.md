# StudentForge LMS: Notifications System - Architecture Inspection & Implementation Plan

**Document Status:** Complete Inspection Report
**Date:** August 25, 2026
**Scope:** Analysis of existing StudentForge LMS architecture for Notifications system design
**Instruction:** DO NOT IMPLEMENT YET - Inspection and planning phase only

---

## A. Existing Notification Architecture

**Current Status:** No notification system exists in StudentForge LMS

**Findings:**
- Zero notification-related code in backend (`grep notification|Notification` returned no matches)
- No Notification model in Prisma schema
- No Socket.io, WebSocket, or real-time infrastructure configured
- No Firebase Cloud Messaging setup
- No toast/alert notification library in frontend (uses `AlertCircle` icon + inline error divs)
- No notification-related routes or controllers
- No notification service or module

---

## A.1 Existing JWT Authentication System (For Socket.io Integration)

**Current Implementation:**
- JWT secret: `process.env.JWT_SECRET` (default: 'super-secret-key-change-me')
- JWT module configured globally in `AuthModule` with 1-day expiration
- JWT strategy: Extracts token from `Authorization: Bearer <token>` header
- Token payload structure: `{ sub: userId, email: string, role: 'STUDENT'|'INSTRUCTOR'|'ADMIN' }`
- Guards: `JwtAuthGuard` (validates token), `RolesGuard` (validates role)

**For Socket.io:**
- Socket.io will use the same `JwtService` and `JwtModule` from auth module
- Token passed in Socket.io handshake query: `auth: { token: jwtToken }`
- Middleware validates token before allowing connection
- UserId extracted as `payload.sub` and associated with socket connection
- Room-based isolation: Each user gets their own room `user_${userId}` for notifications

**Security:**
- ✓ Same JWT secret/validation as REST API
- ✓ No client-controlled userId in Socket.io connections
- ✓ Expired tokens disconnected immediately
- ✓ Role-based filtering prevents cross-role notification leakage

---

## B. New Notification Model Required?

**Decision: YES - Required**

A dedicated `Notification` model is necessary to:
1. Store persistent notification history per user
2. Track read/unread status for UI indicators
3. Enable querying notifications by type, status, time range
4. Maintain referential integrity to originating entities (assignments, announcements, etc.)
5. Support efficient indexes for common queries

---

## C. Recommended Notification Schema

```prisma
model Notification {
  id                String              @id @default(uuid())
  
  // Recipient
  userId            String
  user              User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Context
  courseId          String
  course            Course              @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  // Content
  type              NotificationType
  title             String
  message           String
  
  // Status
  read              Boolean             @default(false)
  readAt            DateTime?
  
  // Related Entity Reference
  relatedEntityId   String?             // e.g., assignmentId, announcementId, liveSessionId
  relatedEntityType String?             // e.g., "ASSIGNMENT", "ANNOUNCEMENT", "LIVE_SESSION"
  actionUrl         String?             // Relative path: /dashboard/instructor/assignments/123
  
  // Timestamps
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  @@index([userId])
  @@index([read])
  @@index([createdAt])
  @@index([courseId])
  @@index([userId, read, createdAt])
}

enum NotificationType {
  // Assignment Notifications
  ASSIGNMENT_SUBMITTED
  ASSIGNMENT_GRADED
  ASSIGNMENT_CREATED
  ASSIGNMENT_DUE_SOON
  
  // Quiz Notifications
  QUIZ_PUBLISHED
  QUIZ_ATTEMPT_COMPLETED
  QUIZ_RESULT_AVAILABLE
  
  // Announcement Notifications
  ANNOUNCEMENT_PUBLISHED
  
  // Live Session Notifications
  LIVE_SESSION_SCHEDULED
  LIVE_SESSION_UPDATED
  LIVE_SESSION_CANCELLED
  LIVE_SESSION_STARTING_SOON
  
  // Enrollment Notifications
  ENROLLMENT_CONFIRMED
  
  // Course Notifications
  COURSE_PUBLISHED
}
```

**Schema Rationale:**
- **userId + courseId indexes:** Notifications are always user-scoped and course-relevant for access control
- **read + createdAt:** Common filtering for "unread count" and "recent notifications"
- **relatedEntityId/Type:** Enables navigation to originating resource without additional DB queries
- **actionUrl:** Pre-computed navigation path to avoid frontend route logic duplication
- **Cascade delete:** Prevents orphaned notifications when related entities are deleted
- **Timezone-aware:** `DateTime` fields use ISO 8601; no timezone conversion needed

---

## D. Notification Type Design

### Supported Now (Based on Existing Functionality)

| Type | Recipient | Trigger | Details |
|------|-----------|---------|---------|
| **ASSIGNMENT_SUBMITTED** | Instructor | Student submits assignment | Include: student name, assignment title, course |
| **ASSIGNMENT_GRADED** | Student | Instructor grades submission | Include: marks, instructor feedback, assignment title |
| **ASSIGNMENT_CREATED** | Enrolled Students | Instructor creates assignment | Include: assignment title, due date (if set) |
| **ANNOUNCEMENT_PUBLISHED** | Enrolled Students | Instructor publishes announcement | Include: announcement title, preview (first 100 chars) |
| **LIVE_SESSION_SCHEDULED** | Enrolled Students | Instructor creates/schedules live session | Include: session title, start time, join link preview |
| **LIVE_SESSION_UPDATED** | Enrolled Students | Instructor modifies scheduled session | Include: what changed (time, link, etc.) |
| **LIVE_SESSION_CANCELLED** | Enrolled Students | Instructor cancels session | Include: session title, cancellation reason if provided |
| **ENROLLMENT_CONFIRMED** | Student | Student enrolls in course | Include: course title, instructor name |
| **COURSE_PUBLISHED** | Enrolled Students | Instructor publishes course | Include: course title |
| **QUIZ_PUBLISHED** | Enrolled Students | Instructor publishes quiz | Include: quiz title, due date if timed |

### Future Notifications (Require Additional Features)

- `ASSIGNMENT_DUE_SOON` — Requires background job/scheduler for deadline reminders
- `QUIZ_ATTEMPT_COMPLETED` — Supported now; not prioritized
- `QUIZ_RESULT_AVAILABLE` — Requires quiz result generation/grading
- `LIVE_SESSION_STARTING_SOON` — Requires scheduled reminders (30 min before)
- `MESSAGE_RECEIVED` — Requires messaging system implementation

### NOT Implementing Yet

- Message-related notifications (messaging system doesn't exist)
- Deadline approaching reminders (no job scheduler)
- Performance-based achievements (not in current scope)
- Social features (follows, badges, etc.)

---

## E. Notification Generation Architecture

**Preferred Pattern:** Service-based, event-driven (Business Event → NotificationService → DB → Optional Real-time)

```
Assignment Submitted Event
        ↓
AssignmentsService.submitAssignment()
        ↓
NotificationService.createNotification()
        ↓
Prisma: Notification created in DB
        ↓
[Optional] Emit Socket.io event (if configured)
        ↓
Frontend polls or receives real-time update
```

**Implementation Details:**

1. **NotificationService** (centralized, reusable)
   - Method: `async createNotification(userId, courseId, type, title, message, relatedEntityId, relatedEntityType, actionUrl)`
   - Handles: Validation, DB persistence, future real-time emission
   - Prevents: Duplicate logic across controllers

2. **Trigger Points in Existing Services:**
   - `AssignmentsService.submitAssignment()` → Notify instructor
   - `AssignmentsService.gradeSubmission()` → Notify student
   - `AnnouncementsService.update()` (DRAFT → PUBLISHED) → Notify enrolled students
   - `CoursesService.create()` / `publishCourse()` → Notify enrolled students
   - `LiveSessionsService.create()` / `update()` / `delete()` → Notify enrolled students
   - `EnrollmentsService.create()` → Notify student + instructor
   - `QuizzesService.publish()` → Notify enrolled students

3. **Enrolled Students Queries:**
   - Get all enrolled students for a course:
     ```prisma
     const enrollments = await prisma.enrollment.findMany({
       where: { courseId },
       select: { studentId: true }
     });
     ```
   - Batch create notifications for multiple users (avoid N+1)

---

## F. API Endpoints

**Base Route:** `/notifications`

| Method | Endpoint | Guard | Role | Purpose |
|--------|----------|-------|------|---------|
| GET | `/notifications` | JwtAuthGuard | All | Get authenticated user's notifications (paginated, most recent first) |
| GET | `/notifications/unread-count` | JwtAuthGuard | All | Get unread notification count (for badge) |
| PATCH | `/notifications/:id/read` | JwtAuthGuard | All | Mark single notification as read |
| PATCH | `/notifications/read-all` | JwtAuthGuard | All | Mark all notifications as read |
| DELETE | `/notifications/:id` | JwtAuthGuard | All | Delete a single notification |
| DELETE | `/notifications` | JwtAuthGuard | All | Delete all notifications |

**Query Parameters:**
- `page` (default: 1) — Pagination page number
- `limit` (default: 20, max: 100) — Notifications per page
- `filter` (optional) — Filter by type (e.g., `?filter=ASSIGNMENT_*`)
- `unreadOnly` (optional) — If true, only unread notifications

**Response Examples:**

```json
// GET /notifications
{
  "data": [
    {
      "id": "uuid-1",
      "type": "ASSIGNMENT_SUBMITTED",
      "title": "New Assignment Submission",
      "message": "Alice Johnson submitted 'Calculus Assignment 1'",
      "read": false,
      "readAt": null,
      "courseId": "course-123",
      "relatedEntityId": "submission-456",
      "actionUrl": "/dashboard/instructor/assignments/123/submissions",
      "createdAt": "2026-08-25T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}

// GET /notifications/unread-count
{
  "unreadCount": 5
}

// PATCH /notifications/:id/read
{
  "id": "uuid-1",
  "read": true,
  "readAt": "2026-08-25T10:35:00Z"
}
```

---

## G. Socket.io Integration Approach

**REQUIRED FOR MVP** - Real-time notifications via Socket.io (not polling)

**Architecture:**
```
Business Event
    ↓
NotificationService.createNotification()
    ↓
Prisma: Persist to CockroachDB (source of truth)
    ↓
NotificationsGateway.emitNotification(userId)
    ↓
Socket.io room: user_${userId}
    ↓
Connected authenticated client receives event
    ↓
Frontend UI updates instantly (no polling needed)
```

**Authentication Strategy:**

Socket.io will use the existing JWT authentication system:

1. **Frontend connects:** Client sends JWT token in Socket.io handshake query
   ```javascript
   // Frontend
   const socket = io('http://localhost:4000', {
     auth: { token: jwtToken }
   });
   ```

2. **Backend validates token:** Custom Socket.io middleware decodes and validates JWT
   ```typescript
   // Backend NotificationsGateway
   @SubscribeMessage('handshake')
   onConnect(socket: Socket, payload: { token: string }) {
     // Validate token using existing JwtService
     const user = this.jwtService.verify(payload.token);
     socket.data.userId = user.sub;
     socket.data.role = user.role;
     
     // Join user-specific room for notification routing
     socket.join(`user_${user.sub}`);
   }
   ```

3. **Emit to authenticated user only:**
   ```typescript
   // After creating notification in NotificationService
   this.notificationsGateway.emitToUser(userId, 'notification:new', notification);
   
   // Gateway method:
   emitToUser(userId: string, event: string, data: any) {
     this.server.to(`user_${userId}`).emit(event, data);
   }
   ```

**Security Guarantees:**
- ✓ Token validated before socket connection established
- ✓ UserId extracted from verified JWT (not client-provided)
- ✓ User can only receive notifications in their own room
- ✓ Instructor can never access student's room or vice versa
- ✓ No global broadcast channels available to regular users
- ✓ Offline notifications stored in DB, retrieved on reconnect via API

**Implementation Details:**

1. **Install dependencies:**
   ```bash
   npm install @nestjs/websockets socket.io socket.io-client @types/socket.io
   ```

2. **Create NotificationsGateway:**
   ```typescript
   @WebSocketGateway({
     namespace: 'notifications',
     cors: { origin: process.env.FRONTEND_URL },
   })
   export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
     @WebSocketServer()
     server: Server;

     constructor(
       private jwtService: JwtService,
       private notificationService: NotificationService,
     ) {}

     // Handle new socket connection
     async handleConnection(socket: Socket) {
       try {
         const token = socket.handshake.auth.token;
         if (!token) {
           socket.disconnect();
           return;
         }

         // Verify JWT token
         const payload = this.jwtService.verify(token);
         socket.data.userId = payload.sub;
         socket.data.role = payload.role;
         socket.data.email = payload.email;

         // Join user-specific room
         socket.join(`user_${payload.sub}`);
         console.log(`User ${payload.sub} connected to notifications`);
       } catch (error) {
         socket.disconnect();
       }
     }

     handleDisconnect(socket: Socket) {
       console.log(`User ${socket.data.userId} disconnected`);
     }

     // Called by NotificationService after creating notification
     emitToUser(userId: string, notification: Notification) {
       this.server.to(`user_${userId}`).emit('notification:new', {
         id: notification.id,
         type: notification.type,
         title: notification.title,
         message: notification.message,
         actionUrl: notification.actionUrl,
         createdAt: notification.createdAt,
       });
     }

     // Emit unread count update
     emitUnreadCountUpdate(userId: string, unreadCount: number) {
       this.server.to(`user_${userId}`).emit('unread-count:update', { unreadCount });
     }
   }
   ```

3. **Update NotificationService:**
   ```typescript
   async createNotification(
     userId: string,
     courseId: string,
     type: NotificationType,
     title: string,
     message: string,
     relatedEntityId?: string,
     relatedEntityType?: string,
     actionUrl?: string,
   ) {
     // Create in DB (source of truth)
     const notification = await this.prisma.notification.create({
       data: {
         userId,
         courseId,
         type,
         title,
         message,
         relatedEntityId,
         relatedEntityType,
         actionUrl,
       },
     });

     // Emit to connected client immediately
     this.notificationsGateway.emitToUser(userId, notification);

     // Update unread count
     const unreadCount = await this.getUnreadCount(userId);
     this.notificationsGateway.emitUnreadCountUpdate(userId, unreadCount);

     return notification;
   }
   ```

4. **Register in app.module:**
   ```typescript
   @Module({
     imports: [
       // ... other imports
       NotificationsModule, // Includes NotificationsGateway
     ],
   })
   export class AppModule {}
   ```

**Database is Source of Truth:**
- All notifications persisted to CockroachDB immediately on creation
- If Socket.io connection fails or user is offline:
  - Notification still exists in database
  - When user reconnects/reopens app, API call retrieves notification
  - UI displays notification from DB even if Socket.io failed
- No notifications are lost

**Frontend Integration:**
```typescript
// frontend/src/hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useNotifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    // Connect to Socket.io gateway
    const newSocket = io('http://localhost:4000/notifications', {
      auth: { token },
    });

    newSocket.on('notification:new', (notification) => {
      // Add to UI immediately
      setNotifications(prev => [notification, ...prev]);
    });

    newSocket.on('unread-count:update', (data) => {
      setUnreadCount(data.unreadCount);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return { notifications, unreadCount, socket };
}
```

---

## H. Firebase Cloud Messaging Status

**Current Status:** NOT implemented
**Recommendation:** Defer to Phase 3 (if mobile app is planned)

**Why Not Now:**
- Requires Firebase project setup and credentials
- Needs mobile app with FCM token registration
- Adds complexity without immediate MVP requirement
- Can be added cleanly later: `NotificationService.sendPushNotification(userId, title, message)`

---

## I. Instructor Notification Types

1. **ASSIGNMENT_SUBMITTED** — New student submission to review
2. **ENROLLMENT_CONFIRMED** — New student enrolled in course
3. **LIVE_SESSION_UPDATED** — (self-generated) System notification when they update session
4. **LIVE_SESSION_CANCELLED** — (self-generated) Confirmation when they cancel
5. **ANNOUNCEMENT_PUBLISHED** — (self-generated) Confirmation when they publish

**Not Applicable to Instructors:**
- Student-facing announcements/assignments/quizzes
- Student quiz results (may be added later)

---

## J. Student Notification Types

1. **ASSIGNMENT_CREATED** — New assignment released in enrolled course
2. **ASSIGNMENT_GRADED** — Assignment graded with feedback
3. **ANNOUNCEMENT_PUBLISHED** — New announcement in enrolled course
4. **LIVE_SESSION_SCHEDULED** — New live session scheduled
5. **LIVE_SESSION_UPDATED** — Scheduled session details changed
6. **LIVE_SESSION_CANCELLED** — Scheduled session cancelled
7. **ENROLLMENT_CONFIRMED** — Course enrollment successful
8. **QUIZ_PUBLISHED** — New quiz available in course
9. **COURSE_PUBLISHED** — Instructor published a course (if applicable)

---

## K. Frontend UI Structure

**Location:** Header notification bell icon (existing header in `frontend/src/app/dashboard/layout.tsx`)

**Component Structure:**
```
Header (existing)
├── Notification Bell Icon (NEW)
│   ├── Unread count badge (red)
│   └── Dropdown trigger
└── Notification Panel (NEW - appears on click)
    ├── Header: "Notifications" + "Mark all as read"
    ├── Filter tabs: "All" | "Unread" | "Assignments" | "Announcements" | etc.
    ├── Notification List (scrollable)
    │   ├── Notification Item (read/unread styling)
    │   │   ├── Icon (based on type)
    │   │   ├── Title + Message
    │   │   ├── Timestamp (relative: "2 hours ago")
    │   │   ├── Action buttons: Mark as read (if unread), Delete
    │   │   └── Click to navigate to related resource
    │   ├── Empty State: "No notifications"
    │   └── Error State: "Failed to load notifications"
    ├── Loading State (skeleton)
    └── Pagination: "View all notifications" link → /dashboard/notifications
```

**Features:**
- Real-time badge update (polling or Socket.io)
- Mark single notification as read/unread
- Delete notification
- Click notification to navigate to resource + mark as read
- Responsive: Bell icon hidden on mobile, expand to sidebar
- Persist state: Remember if panel is open/closed per session

---

## L. Security & RBAC Rules

**Authentication:**
- All notification endpoints require `JwtAuthGuard`
- UserId extracted from JWT token (`req.user.id`)
- No client-controlled `?userId=` parameter accepted

**Authorization:**
- User can only access their own notifications: `notification.userId === req.user.id`
- Students cannot access instructor-specific notifications
- Instructors cannot access other instructors' notifications
- Admins see own notifications only (no admin-specific notifications planned)

**Course-Level Access:**
- Notification must relate to a course user is enrolled in or teaches
- If `notification.courseId` is set, verify: `user is enrolled OR user is instructor OR user is admin`

**Implementation Pattern:**
```typescript
// In NotificationService or Controller
async getNotifications(userId: string) {
  // Only fetch notifications for authenticated user
  return this.prisma.notification.findMany({
    where: { userId }, // NEVER: where: { userId: req.query.userId }
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}
```

---

## M. Database Indexes

**Recommended Indexes:**

```prisma
model Notification {
  // Primary access pattern: "Get my unread notifications, sorted by recent"
  @@index([userId, read, createdAt])
  
  // Secondary: "Get all my notifications by course"
  @@index([userId, courseId])
  
  // Cleanup: "Delete old notifications for user"
  @@index([userId, createdAt])
  
  // Admin/analytics (future): "Get all notifications by type"
  @@index([type, createdAt])
}
```

**Index Performance Estimates:**
- `[userId, read, createdAt]` — O(log N) lookup + O(K) scan for K notifications
- Query: `SELECT * WHERE userId=X AND read=false ORDER BY createdAt DESC LIMIT 20` → ~5ms on 1M rows

---

## N. Test Plan

### Backend Tests (30+ tests)

**Unit Tests (NotificationService):**
1. Create notification successfully
2. Create notification validates all required fields
3. Create notification rejects invalid `relatedEntityType`
4. Get notifications for user (enforces userId)
5. Get notifications does not return other users' notifications
6. Get unread count returns correct count
7. Mark notification as read updates `read` and `readAt`
8. Mark notification as read (non-existent) throws NotFoundException
9. Mark all notifications as read updates all for user
10. Delete notification succeeds
11. Delete notification (non-existent) throws NotFoundException
12. Delete notification returns 204 No Content

**Integration Tests (Notification Creation on Events):**
13. Assignment submission creates ASSIGNMENT_SUBMITTED notification for instructor
14. Assignment grading creates ASSIGNMENT_GRADED notification for student
15. Assignment grading does not notify instructor
16. New announcement (PUBLISHED) creates ANNOUNCEMENT_PUBLISHED notifications for all enrolled students
17. New announcement (DRAFT) does not create notification
18. Live session creation creates LIVE_SESSION_SCHEDULED notifications for all enrolled students
19. Live session update creates LIVE_SESSION_UPDATED notifications
20. Live session cancellation creates LIVE_SESSION_CANCELLED notifications
21. Course enrollment creates ENROLLMENT_CONFIRMED notification for student
22. Quiz publication creates QUIZ_PUBLISHED notifications for enrolled students
23. Course publication creates COURSE_PUBLISHED notifications for enrolled students

**RBAC Tests:**
24. Unauthorized user cannot GET /notifications (no token)
25. User with valid token can only retrieve own notifications
26. Attempting to retrieve another user's notifications returns 403
27. User cannot mark another user's notification as read
28. Student cannot access instructor-scoped notifications
29. Instructor cannot access other instructor's notifications

**Edge Cases:**
30. Batch notification creation (100 students) completes without timeout
31. Notification with `relatedEntityId=null` (for system messages) accepted
32. Notification with very long message (5000 chars) accepted
33. Timezone handling: createdAt stored in UTC

### Frontend Tests (12+ tests)

**Component Tests:**
34. Notification bell displays in header
35. Unread count badge displays correct number
36. Notification bell click opens dropdown
37. Notification list loads and displays notifications
38. Clicking notification navigates to `actionUrl` and marks as read
39. Mark as read button works for single notification
40. Mark all as read button works and updates all items
41. Delete button removes notification from list
42. Empty state displays when no notifications
43. Error state displays with retry button
44. Loading state (skeleton) displays while fetching
45. Pagination "View all" link navigates to full notifications page

---

## O. Safe Implementation Stages

### Stage 1: Backend Foundation - Service & Gateway (5-6 days)
**Goal:** Create NotificationService, Gateway, and API endpoints with Socket.io infrastructure

**Tasks:**
- [ ] Install dependencies: `@nestjs/websockets socket.io socket.io-client @types/socket.io`
- [ ] Add `Notification` model to Prisma schema
- [ ] Create `notifications` module with service, controller, gateway, DTOs
- [ ] Implement `NotificationService` methods:
  - `createNotification(...)` — creates DB record + emits Socket.io
  - `getNotifications(userId, page, limit)`
  - `getUnreadCount(userId)`
  - `markAsRead(notificationId, userId)`
  - `markAllAsRead(userId)`
  - `deleteNotification(notificationId, userId)`
  - `deleteAllNotifications(userId)`
- [ ] Create `NotificationsGateway` with:
  - Socket.io connection handler using JWT authentication
  - User-specific room routing (`user_${userId}`)
  - `emitToUser(userId, notification)` method
  - `emitUnreadCountUpdate(userId, count)` method
- [ ] Create controller endpoints with proper guards and validation
- [ ] Add DTOs for requests/responses
- [ ] Update `NotificationService.createNotification()` to call gateway.emitToUser()
- [ ] Write unit tests for NotificationService (15+ tests)
- [ ] Write gateway tests for Socket.io authentication and emission (10+ tests)
- [ ] Verify API endpoints manually with Postman/curl
- [ ] Verify Socket.io connection with token authentication manually

**Testing:** Service unit tests + gateway tests + manual API/Socket.io testing
**Deliverable:** Working API + authenticated WebSocket gateway (no triggers yet)

---

### Stage 2: Backend Notification Triggers (4-5 days)
**Goal:** Wire notification creation (with real-time Socket.io emission) to existing business events

**Tasks:**
- [ ] Inject `NotificationsGateway` into `AssignmentsService`
  - On `submitAssignment()` → call NotificationService.createNotification() → Socket.io emits
  - On `gradeSubmission()` → call NotificationService.createNotification() → Socket.io emits
- [ ] Inject gateway into `AnnouncementsService`
  - On publish (DRAFT → PUBLISHED) → batch create for all enrolled students with Socket.io emission
- [ ] Inject gateway into `LiveSessionsService`
  - On create → create LIVE_SESSION_SCHEDULED with Socket.io
  - On update → create LIVE_SESSION_UPDATED with Socket.io
  - On cancel → create LIVE_SESSION_CANCELLED with Socket.io
- [ ] Inject gateway into `EnrollmentsService`
  - On create → create ENROLLMENT_CONFIRMED with Socket.io
- [ ] Inject gateway into `CoursesService` (if exists)
  - On publish → create COURSE_PUBLISHED with Socket.io
- [ ] Inject gateway into `QuizzesService`
  - On publish → create QUIZ_PUBLISHED with Socket.io
- [ ] Update all trigger points to call NotificationService (not emit directly)
- [ ] Write integration tests for each trigger (15+ tests per service)
- [ ] Manual testing: Create assignment → verify instructor's Socket.io client receives notification instantly

**Testing:** Integration tests + Socket.io real-time testing
**Deliverable:** Real-time notifications emitted on all business events, persisted in DB

---

### Stage 3: Frontend Notification UI with Real-Time Socket.io (3-4 days)
**Goal:** Build notification bell and dropdown panel with real-time Socket.io updates

**Tasks:**
- [ ] Install `socket.io-client` in frontend
- [ ] Create `useNotifications()` hook
  - Connect Socket.io with JWT token on mount
  - Listen for `notification:new` event
  - Listen for `unread-count:update` event
  - Fetch initial notifications from API
  - Handle connection/disconnection states
- [ ] Create `NotificationBell.tsx` component
  - Display bell icon with unread count badge (from Socket.io real-time)
  - Handle click to toggle dropdown
- [ ] Create `NotificationDropdown.tsx` component
  - Display recent notifications (updated real-time from Socket.io)
  - Show loading/empty/error states
  - Filter tabs (All, Unread, by type)
  - Mark single as read on click
  - Delete button functionality
  - Auto-scroll to new notifications
- [ ] Add NotificationBell to header in `frontend/src/app/dashboard/layout.tsx`
- [ ] Create full `/dashboard/notifications` page
  - Paginated list view (fetched from API)
  - Real-time updates from Socket.io when new notifications arrive
  - Filter by type/status
  - Bulk actions (mark all, delete all)
- [ ] Style with Tailwind (match existing dark theme: neutral-900 bg)
- [ ] Use Lucide icons for notification types
- [ ] Test real-time updates: Create assignment, observe instant notification in UI
- [ ] Write component tests (12+ tests)

**Testing:** Component tests + manual Socket.io real-time testing
**Deliverable:** Functional notification UI with real-time Socket.io updates

---

### Stage 4: Integration & Refinement (2-3 days)
**Goal:** End-to-end testing, optimization, documentation

**Tasks:**
- [ ] E2E test: Create assignment → Verify instructor notification appears in UI
- [ ] E2E test: Grade assignment → Verify student notification appears
- [ ] E2E test: Publish announcement → Verify all students get notification
- [ ] Performance: Test with 100+ notifications per user
- [ ] Verify pagination works correctly
- [ ] Test notification links navigate to correct pages
- [ ] Verify RBAC: Student cannot see instructor notifications
- [ ] Add JSDoc comments to NotificationService methods
- [ ] Document API endpoints in README
- [ ] Write brief architecture doc for future developers

**Testing:** E2E tests + performance testing
**Deliverable:** Production-ready notification system

---

## Timeline Summary

| Stage | Duration | Milestones |
|-------|----------|-----------|
| 1 | 5-6 days | NotificationsGateway with JWT auth working, API endpoints + Socket.io emission tested |
| 2 | 4-5 days | Notification triggers integrated, real-time notifications delivered on all events |
| 3 | 3-4 days | Frontend UI complete, Socket.io real-time updates working, component tests passing |
| 4 | 2-3 days | E2E testing (create event → see real-time notification), performance testing, documentation |
| **Total** | **14-18 days** | Full real-time notification system shipped |

---

## Future Enhancements (Post-MVP)

1. **Email Notifications** — Integrate email service for digest/critical alerts
2. **Push Notifications** — Firebase Cloud Messaging for mobile apps
3. **Notification Preferences** — Let users customize which types they receive
4. **Do Not Disturb** — Time-based suppression of notifications
5. **Notification Archiving** — Move old notifications to archive instead of deleting
6. **Scheduled Reminders** — Background job for deadline approaching notifications (requires job scheduler)
7. **Notification Groups** — Collapse similar notifications (e.g., "5 students submitted")
8. **Admin Dashboard** — View all notifications, analytics, delivery stats
9. **Localization** — Multi-language notification messages
10. **Offline Persistence** — Service Worker caching for offline access

---

## Implementation Readiness Checklist

Before starting Stage 1, confirm:

- [ ] Prisma schema is backed up or on version control (it is)
- [ ] Database connection string working (CockroachDB)
- [ ] Team familiar with NestJS service/controller patterns
- [ ] Frontend build pipeline working (Next.js)
- [ ] Test infrastructure in place (Jest for backend, Vitest for frontend likely)
- [ ] Code review process defined
- [ ] Deployment pipeline ready (if applicable)

---

**Document Complete.**

Next step: **User approval to proceed with Stage 1 implementation.**

Awaiting confirmation: Should we begin Stage 1 (Backend Foundation)?

