# Notifications System - Implementation Checklist

**Status:** Ready for Stage 1 Implementation
**Architecture:** Real-Time Socket.io with JWT + Persistent Database
**Total Stages:** 4 | **Estimated Duration:** 14-18 days

---

## ✅ PRE-IMPLEMENTATION VERIFICATION

Before starting Stage 1, confirm:

- [ ] Architecture review approved by team
- [ ] Socket.io + JWT approach accepted
- [ ] Database backup/version control confirmed
- [ ] CockroachDB connection tested
- [ ] NestJS project structure understood
- [ ] Prisma schema modifiable (no migration blockers)
- [ ] Frontend Socket.io-client dependencies available
- [ ] Test infrastructure ready (Jest, Vitest)

---

## 📋 STAGE 1: Backend Service + Gateway (5-6 Days)

### 1.1 Setup & Dependencies
- [ ] Install: `@nestjs/websockets socket.io @types/socket.io`
- [ ] Verify NestJS version compatible (v11.0.1 in use)
- [ ] Verify @nestjs/jwt available (v11.0.2 in use)
- [ ] Check Socket.io compatibility with Node version

### 1.2 Prisma Schema
- [ ] Add `Notification` model to schema
- [ ] Add `NotificationType` enum with all 10 types:
  - [ ] ASSIGNMENT_SUBMITTED
  - [ ] ASSIGNMENT_GRADED
  - [ ] ASSIGNMENT_CREATED
  - [ ] ANNOUNCEMENT_PUBLISHED
  - [ ] LIVE_SESSION_SCHEDULED
  - [ ] LIVE_SESSION_UPDATED
  - [ ] LIVE_SESSION_CANCELLED
  - [ ] ENROLLMENT_CONFIRMED
  - [ ] COURSE_PUBLISHED
  - [ ] QUIZ_PUBLISHED
- [ ] Add indexes:
  - [ ] `@@index([userId])`
  - [ ] `@@index([read])`
  - [ ] `@@index([createdAt])`
  - [ ] `@@index([courseId])`
  - [ ] `@@index([userId, read, createdAt])`
- [ ] Run `npx prisma migrate dev --name add_notifications`
- [ ] Verify migration applied to CockroachDB

### 1.3 Create Notifications Module
- [ ] Create directory: `backend/src/notifications/`
- [ ] Create files:
  - [ ] `notifications.module.ts`
  - [ ] `notifications.service.ts`
  - [ ] `notifications.controller.ts`
  - [ ] `notifications.gateway.ts`
  - [ ] `dto/create-notification.dto.ts`
  - [ ] `dto/get-notifications-response.dto.ts`
  - [ ] `dto/mark-read.dto.ts`

### 1.4 NotificationsService Implementation
Implement methods with full error handling:

- [ ] `async createNotification(userId, courseId, type, title, message, ...)`
  - [ ] Validate required fields
  - [ ] Insert into Prisma
  - [ ] Call `this.gateway.emitToUser(userId, notification)`
  - [ ] Return created notification
  - [ ] Catch and throw appropriate NestJS exceptions

- [ ] `async getNotifications(userId, page, limit)`
  - [ ] Query by userId with pagination
  - [ ] Order by createdAt DESC
  - [ ] Return paginated response with total count
  - [ ] Enforce userId from JWT (no client override)

- [ ] `async getUnreadCount(userId)`
  - [ ] Query COUNT(*) WHERE userId AND read=false
  - [ ] Return { unreadCount: number }

- [ ] `async markAsRead(notificationId, userId)`
  - [ ] Verify notification belongs to user
  - [ ] Update read=true, readAt=now
  - [ ] Call `this.gateway.emitUnreadCountUpdate(userId, newCount)`
  - [ ] Return updated notification

- [ ] `async markAllAsRead(userId)`
  - [ ] Update all notifications for user where read=false
  - [ ] Call `this.gateway.emitUnreadCountUpdate(userId, 0)`
  - [ ] Return count updated

- [ ] `async deleteNotification(notificationId, userId)`
  - [ ] Verify ownership
  - [ ] Delete from DB
  - [ ] Return 204 or success response

- [ ] `async deleteAllNotifications(userId)`
  - [ ] Delete all for user
  - [ ] Return count deleted

### 1.5 NotificationsGateway Implementation
- [ ] Implement `WebSocketGateway` decorator with:
  - [ ] `namespace: 'notifications'`
  - [ ] `cors: { origin: process.env.FRONTEND_URL }`

- [ ] Implement `OnGatewayConnection`:
  - [ ] Extract JWT from `socket.handshake.auth.token`
  - [ ] Validate using `this.jwtService.verify(token)`
  - [ ] Store `socket.data.userId = payload.sub`
  - [ ] Store `socket.data.role = payload.role`
  - [ ] Join room: `socket.join(\`user_${userId}\`)`
  - [ ] Log connection
  - [ ] Disconnect if token invalid

- [ ] Implement `OnGatewayDisconnect`:
  - [ ] Log disconnection
  - [ ] User will auto-rejoin on reconnect

- [ ] Implement `emitToUser(userId, notification)`:
  - [ ] Call `this.server.to(\`user_${userId}\`).emit('notification:new', notification)`
  - [ ] Include: id, type, title, message, actionUrl, createdAt

- [ ] Implement `emitUnreadCountUpdate(userId, count)`:
  - [ ] Call `this.server.to(\`user_${userId}\`).emit('unread-count:update', { unreadCount: count })`

- [ ] Add error handling:
  - [ ] Invalid token → disconnect
  - [ ] Expired token → disconnect
  - [ ] Missing token → disconnect

### 1.6 NotificationsController Implementation
- [ ] Create `NotificationsController` in `notifications.controller.ts`
- [ ] Add endpoints (all protected by `@UseGuards(JwtAuthGuard)`):

  **GET /notifications**
  - [ ] Extract userId from `req.user.id`
  - [ ] Query parameters: page (default 1), limit (default 20, max 100)
  - [ ] Call `service.getNotifications(userId, page, limit)`
  - [ ] Return paginated response

  **GET /notifications/unread-count**
  - [ ] Extract userId from JWT
  - [ ] Call `service.getUnreadCount(userId)`
  - [ ] Return `{ unreadCount: number }`

  **PATCH /notifications/:id/read**
  - [ ] Extract userId from JWT
  - [ ] Validate notification exists and belongs to user
  - [ ] Call `service.markAsRead(id, userId)`
  - [ ] Return updated notification

  **PATCH /notifications/read-all**
  - [ ] Extract userId from JWT
  - [ ] Call `service.markAllAsRead(userId)`
  - [ ] Return success response

  **DELETE /notifications/:id**
  - [ ] Extract userId from JWT
  - [ ] Verify ownership
  - [ ] Call `service.deleteNotification(id, userId)`
  - [ ] Return 204 No Content

  **DELETE /notifications**
  - [ ] Extract userId from JWT
  - [ ] Call `service.deleteAllNotifications(userId)`
  - [ ] Return count deleted

### 1.7 DTOs
- [ ] CreateNotificationDto:
  - [ ] userId: string (required)
  - [ ] courseId: string (required)
  - [ ] type: NotificationType (required)
  - [ ] title: string (required, max 200 chars)
  - [ ] message: string (required, max 2000 chars)
  - [ ] relatedEntityId?: string (optional)
  - [ ] relatedEntityType?: string (optional)
  - [ ] actionUrl?: string (optional)

- [ ] GetNotificationsResponseDto:
  - [ ] data: Notification[]
  - [ ] pagination: { page, limit, total, totalPages }

### 1.8 Module Registration
- [ ] Create `notifications.module.ts`:
  ```typescript
  @Module({
    imports: [PrismaModule, JwtModule],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationsGateway],
    exports: [NotificationsService, NotificationsGateway],
  })
  export class NotificationsModule {}
  ```

- [ ] Register in `app.module.ts`:
  ```typescript
  // Add to imports array
  NotificationsModule,
  ```

### 1.9 Unit Tests (NotificationService)
Create `notifications.service.spec.ts`:

- [ ] Test createNotification:
  - [ ] Valid input → creates and returns notification
  - [ ] Invalid type → throws BadRequestException
  - [ ] Missing userId → throws BadRequestException
  - [ ] DB error → throws InternalServerErrorException

- [ ] Test getNotifications:
  - [ ] Returns paginated list for user
  - [ ] Enforces userId (cannot get other user's notifications)
  - [ ] Pagination works (page 1, 2, 3)
  - [ ] OrderBy createdAt DESC

- [ ] Test getUnreadCount:
  - [ ] Returns correct count
  - [ ] Counts only read=false

- [ ] Test markAsRead:
  - [ ] Updates read flag and readAt
  - [ ] Returns updated notification
  - [ ] Non-existent notification → throws NotFoundException
  - [ ] Other user's notification → throws ForbiddenException

- [ ] Test markAllAsRead:
  - [ ] Updates all unread notifications for user
  - [ ] Returns count

- [ ] Test deleteNotification:
  - [ ] Deletes notification
  - [ ] Enforces ownership
  - [ ] Non-existent → throws NotFoundException

### 1.10 Gateway Tests (Socket.io)
Create `notifications.gateway.spec.ts`:

- [ ] Test handleConnection:
  - [ ] Valid token → connection established
  - [ ] Valid token → user_${userId} room joined
  - [ ] Invalid token → disconnects
  - [ ] Expired token → disconnects
  - [ ] Missing token → disconnects

- [ ] Test emitToUser:
  - [ ] Emits to correct room only
  - [ ] Does not emit to other users' rooms

- [ ] Test emitUnreadCountUpdate:
  - [ ] Emits unread count event

- [ ] Test handleDisconnect:
  - [ ] Logs disconnection

### 1.11 Manual Testing (Postman/curl + Socket.io Client)

- [ ] **API Testing:**
  - [ ] POST create notification (no triggers yet, manual test)
  - [ ] GET notifications → returns list
  - [ ] GET unread-count → returns count
  - [ ] PATCH mark as read → updates and returns notification
  - [ ] DELETE notification → removes it
  - [ ] RBAC: Try to access another user's notification → 403 Forbidden

- [ ] **Socket.io Testing:**
  - [ ] Connect with valid token → connection succeeds
  - [ ] Connect with invalid token → connection fails
  - [ ] Create notification via API → Socket.io event received in client
  - [ ] Multiple clients for same user → both receive notification
  - [ ] Different users do NOT receive each other's notifications
  - [ ] Disconnect and reconnect → user can still fetch from API

### 1.12 Documentation
- [ ] Add JSDoc comments to all service methods
- [ ] Add JSDoc comments to gateway methods
- [ ] Document Socket.io events (emitted by server)
- [ ] Document API endpoint schemas
- [ ] Add README section for notifications architecture

### 1.13 Code Review Checklist
Before moving to Stage 2:
- [ ] All endpoints protected by JwtAuthGuard
- [ ] UserId always from verified JWT (never from client)
- [ ] No SQL injection vulnerabilities (using Prisma)
- [ ] Error handling comprehensive (no unhandled exceptions)
- [ ] Tests pass (unit + gateway)
- [ ] Manual testing successful
- [ ] No console.error() in production code (use logger)
- [ ] Security checklist items verified

---

## 📋 STAGE 2: Backend Triggers (4-5 Days)

### 2.1 Assignments Service Integration
- [ ] Inject `NotificationsGateway` into `AssignmentsService`
- [ ] In `submitAssignment()`:
  - [ ] After successful submission, call:
    ```typescript
    await this.notificationService.createNotification(
      instructor.id,
      courseId,
      NotificationType.ASSIGNMENT_SUBMITTED,
      `New submission: ${assignment.title}`,
      `${student.name} submitted "${assignment.title}"`,
      submissionId,
      'ASSIGNMENT_SUBMISSION',
      `/dashboard/instructor/assignments/${assignmentId}/submissions`
    );
    ```

- [ ] In `gradeSubmission()`:
  - [ ] After grading, call:
    ```typescript
    await this.notificationService.createNotification(
      submission.student.id,
      assignment.courseId,
      NotificationType.ASSIGNMENT_GRADED,
      `Graded: ${assignment.title}`,
      `Assignment graded. Marks: ${marks}/${assignment.maxMarks}`,
      submissionId,
      'ASSIGNMENT_SUBMISSION',
      `/dashboard/student/assignments/${assignmentId}/submission`
    );
    ```

- [ ] Write integration tests (5+ tests)

### 2.2 Announcements Service Integration
- [ ] Inject into `AnnouncementsService`
- [ ] In `update()` when transitioning DRAFT → PUBLISHED:
  - [ ] Get all enrollments for course
  - [ ] Batch create notifications for all students:
    ```typescript
    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      select: { studentId: true }
    });
    
    await Promise.all(enrollments.map(e =>
      this.notificationService.createNotification(
        e.studentId,
        courseId,
        NotificationType.ANNOUNCEMENT_PUBLISHED,
        `New announcement: ${announcement.title}`,
        announcement.content.substring(0, 100) + '...',
        announcementId,
        'ANNOUNCEMENT',
        `/dashboard/student/announcements/${announcementId}`
      )
    ));
    ```

- [ ] Write integration tests (5+ tests)

### 2.3 Live Sessions Service Integration
- [ ] Inject into `LiveSessionsService`
- [ ] In `create()`:
  - [ ] Get enrolled students
  - [ ] Create LIVE_SESSION_SCHEDULED for each

- [ ] In `update()`:
  - [ ] Create LIVE_SESSION_UPDATED for enrolled students

- [ ] In `cancel()`:
  - [ ] Create LIVE_SESSION_CANCELLED for enrolled students

- [ ] Write integration tests (5+ tests)

### 2.4 Enrollments Service Integration
- [ ] Inject into `EnrollmentsService`
- [ ] In `create()` after successful enrollment:
  - [ ] Create ENROLLMENT_CONFIRMED:
    ```typescript
    await this.notificationService.createNotification(
      studentId,
      courseId,
      NotificationType.ENROLLMENT_CONFIRMED,
      `Enrolled: ${course.title}`,
      `You are now enrolled in ${course.title}`,
      courseId,
      'COURSE',
      `/dashboard/student/courses/${courseId}`
    );
    ```

- [ ] Write integration tests (5+ tests)

### 2.5 Courses Service Integration (If Exists)
- [ ] Inject into `CoursesService`
- [ ] In `publishCourse()`:
  - [ ] Create COURSE_PUBLISHED for enrolled students

- [ ] Write integration tests (3+ tests)

### 2.6 Quizzes Service Integration (If Exists)
- [ ] Inject into `QuizzesService`
- [ ] In `publishQuiz()`:
  - [ ] Create QUIZ_PUBLISHED for enrolled students

- [ ] Write integration tests (3+ tests)

### 2.7 Integration Testing
- [ ] Test: Submit assignment → Instructor notification appears (real-time + API)
- [ ] Test: Grade assignment → Student notification appears (real-time + API)
- [ ] Test: Publish announcement → 50 students get notifications
- [ ] Test: Create live session → Enrolled students get notifications
- [ ] Test: Enroll in course → Student gets notification
- [ ] Test: Offline scenario → Notification in DB, retrieved after reconnect

### 2.8 Code Review (Stage 2)
- [ ] All triggers call NotificationService (not emit directly)
- [ ] Batch operations use Promise.all() efficiently
- [ ] No missing imports or undefined references
- [ ] Error handling: Notification failure doesn't break main operation
- [ ] All integration tests passing
- [ ] Manual E2E testing successful

---

## 📋 STAGE 3: Frontend UI (3-4 Days)

### 3.1 Dependencies
- [ ] Install: `socket.io-client`
- [ ] Verify Tailwind CSS available
- [ ] Verify Lucide React icons available

### 3.2 Create useNotifications Hook
File: `frontend/src/hooks/useNotifications.ts`

- [ ] Export `function useNotifications()`
- [ ] Initialize Socket.io connection on mount:
  - [ ] Connect to `http://localhost:4000/notifications`
  - [ ] Pass JWT token in `auth: { token }`
  - [ ] Set reconnection options

- [ ] Listen for Socket.io events:
  - [ ] `notification:new` → add to notifications array
  - [ ] `unread-count:update` → update badge

- [ ] Fetch initial notifications from API on mount:
  - [ ] GET `/notifications?limit=20`
  - [ ] GET `/notifications/unread-count`

- [ ] Handle connection states:
  - [ ] `connect` → set isConnected = true
  - [ ] `disconnect` → set isConnected = false

- [ ] Return:
  - [ ] notifications: Notification[]
  - [ ] unreadCount: number
  - [ ] isConnected: boolean
  - [ ] markAsRead: (id) => Promise
  - [ ] deleteNotification: (id) => Promise
  - [ ] loading: boolean

### 3.3 Create NotificationBell Component
File: `frontend/src/app/dashboard/components/NotificationBell.tsx`

- [ ] Display Bell icon (Lucide)
- [ ] Show unread count badge (red circle, top-right)
- [ ] Handle click → open/close dropdown
- [ ] Show connection status (if disconnected, show "reconnecting...")
- [ ] Styling: Match existing dark theme (neutral-900 bg, white text)

### 3.4 Create NotificationDropdown Component
File: `frontend/src/app/dashboard/components/NotificationDropdown.tsx`

**Structure:**
```
Header: "Notifications" | "Mark all as read"
Tabs: All | Unread | Assignments | Announcements | Sessions | Quizzes
List:
  - NotificationItem
    - Icon (by type)
    - Title
    - Message (truncate 100 chars)
    - Timestamp (relative: "2h ago")
    - Actions: Mark read (if unread), Delete
    - Click → navigate to actionUrl + mark as read
  - Empty state
  - Error state
  - Loading skeleton
Footer: "View all notifications" link
```

- [ ] Display recent notifications (max 10)
- [ ] Filter by type (All, Unread, ASSIGNMENT*, ANNOUNCEMENT*, LIVE_SESSION*, QUIZ*)
- [ ] Mark single notification as read on click
- [ ] Delete button functionality
- [ ] Real-time updates: New notifications appear instantly
- [ ] Timestamp format: Relative time (2h ago, 30m ago)
- [ ] Click notification → navigate to actionUrl + mark as read

### 3.5 Create NotificationPage
File: `frontend/src/app/dashboard/notifications/page.tsx`

- [ ] Full-page view of all notifications
- [ ] Paginated list (20 per page)
- [ ] Filter tabs: All | Unread | By Type
- [ ] Bulk actions: Mark all as read, Delete all
- [ ] Real-time updates from Socket.io
- [ ] Empty state with illustration
- [ ] Error state with retry button
- [ ] Responsive: Mobile-friendly layout

### 3.6 Add to Header Layout
File: `frontend/src/app/dashboard/layout.tsx`

- [ ] Import NotificationBell component
- [ ] Add to header (right side, before user menu)
- [ ] Position: After search/other items, before logout

### 3.7 Notification Item Component
File: `frontend/src/app/dashboard/components/NotificationItem.tsx`

Helper component for rendering single notification:
- [ ] Icon (based on type)
- [ ] Title (bold)
- [ ] Message (regular)
- [ ] Timestamp
- [ ] Read/unread styling (unread: light blue bg)
- [ ] Hover state
- [ ] Action buttons

### 3.8 Notification Icons Map
File: `frontend/src/app/dashboard/components/notificationIcons.ts`

Map notification type → Lucide icon:
- [ ] ASSIGNMENT_SUBMITTED → CheckCircle
- [ ] ASSIGNMENT_GRADED → Award
- [ ] ASSIGNMENT_CREATED → BookOpen
- [ ] ANNOUNCEMENT_PUBLISHED → Bell
- [ ] LIVE_SESSION_SCHEDULED → Video
- [ ] LIVE_SESSION_UPDATED → AlertCircle
- [ ] LIVE_SESSION_CANCELLED → X
- [ ] ENROLLMENT_CONFIRMED → CheckCircle
- [ ] COURSE_PUBLISHED → BookOpen
- [ ] QUIZ_PUBLISHED → HelpCircle

### 3.9 Component Tests (Vitest/Jest)
Create `__tests__/useNotifications.test.ts`:
- [ ] Hook connects with valid token
- [ ] Hook disconnects on unmount
- [ ] Listens for `notification:new` event
- [ ] Listens for `unread-count:update` event
- [ ] Fetches initial notifications on mount
- [ ] Returns notifications array
- [ ] Returns unreadCount

Create `__tests__/NotificationBell.test.tsx`:
- [ ] Renders bell icon
- [ ] Displays unread count badge
- [ ] Click opens dropdown
- [ ] Click closes dropdown
- [ ] Shows connection status

Create `__tests__/NotificationDropdown.test.tsx`:
- [ ] Renders notifications list
- [ ] Filters by type
- [ ] Mark as read works
- [ ] Delete works
- [ ] Click notification navigates
- [ ] Empty state displays
- [ ] Real-time updates work

### 3.10 Manual Testing (Browser + DevTools)
- [ ] Create assignment as instructor
- [ ] Switch to student browser → See notification bell badge update instantly
- [ ] Click bell → See notification in dropdown
- [ ] Click notification → Navigate to assignment + mark as read
- [ ] Unread badge disappears after marking read
- [ ] Close browser, reopen → Notifications still there (from API)
- [ ] Create announcement → 50 students see it instantly (if Socket.io test with multiple clients)
- [ ] Network throttle to slow → UI still works (falls back to API)
- [ ] Disconnect network → Notification still in DB, retrieved when reconnected

### 3.11 UI/UX Refinement
- [ ] Notification animations (fade-in for new)
- [ ] Loading skeletons while fetching
- [ ] Keyboard shortcuts (if applicable)
- [ ] Accessibility: ARIA labels, focus management
- [ ] Responsive on mobile (bell icon collapsible)
- [ ] Dark mode styling verified

### 3.12 Code Review (Stage 3)
- [ ] All Socket.io listeners cleaned up on unmount
- [ ] JWT token passed securely (not logged)
- [ ] No console.log() in production code
- [ ] Component tests passing
- [ ] Manual testing successful
- [ ] No TypeScript errors

---

## 📋 STAGE 4: Integration & Testing (2-3 Days)

### 4.1 End-to-End Testing
- [ ] **Test 1: Assignment Submission**
  - [ ] Instructor opens assignment page
  - [ ] Student submits assignment
  - [ ] Instructor's browser receives notification instantly
  - [ ] Check: Notification bell badge updates
  - [ ] Check: Notification appears in dropdown
  - [ ] Check: Notification in database

- [ ] **Test 2: Assignment Grading**
  - [ ] Instructor grades assignment
  - [ ] Student's browser receives notification instantly
  - [ ] Check: Mark displayed correctly
  - [ ] Check: Feedback visible

- [ ] **Test 3: Announcement Publishing**
  - [ ] Instructor publishes announcement to 10+ students
  - [ ] All students receive notification simultaneously
  - [ ] Check: No notifications lost
  - [ ] Check: Database has 10+ notification records

- [ ] **Test 4: Live Session Creation**
  - [ ] Instructor creates live session
  - [ ] Enrolled students receive notifications
  - [ ] Check: Session link in notification

- [ ] **Test 5: Offline Scenario**
  - [ ] Student offline
  - [ ] Instructor creates assignment
  - [ ] Notification stored in DB
  - [ ] Student goes online / opens app
  - [ ] Notification appears (fetched from API)

- [ ] **Test 6: Multiple Tabs/Windows**
  - [ ] Student opens two browser tabs/windows
  - [ ] Instructor creates assignment
  - [ ] Both tabs receive notification
  - [ ] Marking as read in one tab updates badge in other

### 4.2 Performance Testing
- [ ] **Test:** Create 100 notifications for single user
  - [ ] API response time < 1 second
  - [ ] Database query time < 500ms
  - [ ] Pagination works correctly

- [ ] **Test:** Batch announcement to 1000 students
  - [ ] All 1000 notifications created in < 5 seconds
  - [ ] No timeouts
  - [ ] Socket.io emits complete

- [ ] **Test:** Socket.io performance
  - [ ] 100 simultaneous connections
  - [ ] Emit to 100 users simultaneously
  - [ ] No memory leaks
  - [ ] CPU usage acceptable

### 4.3 Security Testing
- [ ] **Test:** JWT validation
  - [ ] Invalid token → Socket.io rejects
  - [ ] Expired token → Socket.io disconnects
  - [ ] No token → Socket.io rejects

- [ ] **Test:** RBAC enforcement
  - [ ] Student cannot see instructor's notifications
  - [ ] Instructor cannot see other instructor's notifications
  - [ ] Admin sees own notifications (not all)

- [ ] **Test:** Room isolation
  - [ ] User A cannot join user B's room
  - [ ] User A cannot sniff user B's events
  - [ ] No global broadcast channel accessible

- [ ] **Test:** API security
  - [ ] GET /notifications → returns own only
  - [ ] Cannot override userId in query params
  - [ ] Unauthorized request → 401 Unauthorized

### 4.4 Reliability Testing
- [ ] **Test:** Network interruption
  - [ ] Connection drops during notification emit
  - [ ] Notification still in database
  - [ ] Socket.io reconnects automatically
  - [ ] No duplicate notifications

- [ ] **Test:** Database failure
  - [ ] Database temporarily unavailable
  - [ ] System gracefully degrades
  - [ ] Error message shown to user
  - [ ] No crash

- [ ] **Test:** High load
  - [ ] 1000+ notifications per second
  - [ ] System handles gracefully
  - [ ] No timeout errors

### 4.5 Compatibility Testing
- [ ] **Browsers:** Chrome, Firefox, Safari, Edge
- [ ] **Mobile:** iOS Safari, Android Chrome
- [ ] **Network:** WiFi, 4G/5G, slow connections (DevTools throttle)
- [ ] **Devices:** Desktop, tablet, mobile

### 4.6 Documentation
- [ ] **README update:**
  - [ ] Architecture overview (diagram)
  - [ ] Socket.io authentication flow
  - [ ] API endpoints documentation
  - [ ] Database schema

- [ ] **Developer Guide:**
  - [ ] How to add new notification type
  - [ ] How to trigger notification from service
  - [ ] How to test Socket.io locally

- [ ] **Architecture Decision Record (ADR):**
  - [ ] Why Socket.io over polling
  - [ ] Why JWT for authentication
  - [ ] Why database as source of truth

### 4.7 Deployment Checklist
Before pushing to production:
- [ ] All tests passing (unit, integration, component, E2E)
- [ ] Code coverage > 80%
- [ ] No console.log() or debug code
- [ ] No hardcoded URLs (use env vars)
- [ ] CORS configured correctly
- [ ] Rate limiting configured (if applicable)
- [ ] Error logging configured
- [ ] Monitoring/alerting configured
- [ ] Database backups verified
- [ ] Rollback plan documented

### 4.8 Post-Deployment Monitoring
- [ ] Monitor Socket.io connection errors
- [ ] Monitor API error rates
- [ ] Monitor database performance
- [ ] Monitor unread notification counts (for sanity check)
- [ ] User feedback collection
- [ ] Bug reporting process

---

## 🔒 Security Verification (All Stages)

### Before Stage 1 Completion:
- [ ] JWT token validation tested
- [ ] Socket.io rejects invalid tokens
- [ ] UserId from JWT only (never client-provided)
- [ ] Room isolation verified
- [ ] No cross-user notification leakage

### Before Stage 2 Completion:
- [ ] All triggers correctly identify recipient user
- [ ] Batch operations enforce enrollment checks
- [ ] Instructor cannot create student notifications
- [ ] Student cannot create instructor notifications

### Before Stage 3 Completion:
- [ ] JWT token not logged/exposed in frontend
- [ ] Socket.io auth token not exposed in localStorage
- [ ] No sensitive data in notification messages

### Before Stage 4 Completion:
- [ ] Penetration testing (simulated)
- [ ] SQL injection tests
- [ ] XSS prevention verified
- [ ] CSRF protection (if applicable)

---

## 📊 Sign-Off Criteria

### Stage 1 Sign-Off:
- [ ] All unit tests passing (> 90% coverage)
- [ ] Gateway tests passing
- [ ] Manual API testing successful
- [ ] Socket.io connection + authentication working
- [ ] No unhandled exceptions
- [ ] Code review approved

### Stage 2 Sign-Off:
- [ ] All integration tests passing
- [ ] Notifications correctly triggered on events
- [ ] Real-time delivery verified
- [ ] Batch operations efficient
- [ ] Code review approved

### Stage 3 Sign-Off:
- [ ] All component tests passing
- [ ] UI looks correct (screenshots)
- [ ] Real-time updates working
- [ ] Mobile responsive
- [ ] Code review approved

### Stage 4 Sign-Off:
- [ ] All E2E tests passing
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete
- [ ] Ready for production deployment

---

## 🚀 Quick Reference

### Key Files to Create
- Backend: `notifications.{service,controller,gateway,module}.ts` + DTOs
- Frontend: `useNotifications.ts` hook + components
- Tests: service.spec.ts, gateway.spec.ts, component tests

### Key Commands
```bash
# Backend
npx prisma migrate dev --name add_notifications
npm test -- notifications
npm run start:dev

# Frontend
npm install socket.io-client
npm run dev
npm test -- useNotifications
```

### Key Environment Variables
```
JWT_SECRET=your-secret-key (backend)
FRONTEND_URL=http://localhost:3000 (backend, for CORS)
```

---

**Last Updated:** August 25, 2026
**Status:** Ready for Implementation

