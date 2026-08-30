# Notifications Architecture - UPDATED with Socket.io Real-Time

**Update Date:** August 25, 2026
**Status:** Architecture Updated - Ready for Implementation
**Change:** Polling → Real-Time Socket.io (Primary Delivery)

---

## CRITICAL CHANGE: Real-Time is NOW Required for MVP

### Previous Design (SUPERSEDED)
- Polling-based: Frontend polls `/notifications/unread-count` every 30 seconds
- Notifications appear with 30-second delay
- Not suitable for StudentForge LMS use case

### NEW DESIGN (ACTIVE)
- **Socket.io WebSocket Gateway** for instant real-time delivery
- **Database remains source of truth** (all notifications persisted immediately)
- **Offline-safe:** If user disconnects, notifications stored in DB, retrieved on reconnect
- **Same JWT authentication** as existing REST API (leverages `JwtModule` and `JwtService`)
- **Room-based routing:** Each user gets isolated `user_${userId}` room
- **Integrated into MVP** - not deferred to Phase 2

---

## Key Architecture Decisions

### 1. Socket.io Authentication (Security First)

✓ **Using Existing JWT System:**
- Reuse `JwtService` from `AuthModule`
- Same JWT secret and validation logic
- Token passed in Socket.io handshake auth query
- UserId extracted from verified JWT payload (`payload.sub`)

✓ **NOT Accepting Client-Provided UserId:**
- Socket.io middleware validates token before connection
- UserId determined from verified JWT, never from client
- Prevents cross-user notification access

✓ **Room Isolation:**
- Each authenticated user joins room: `user_${userId}`
- Notifications emitted only to user's room
- No global broadcast channels available
- Instructor/Student rooms are completely isolated

### 2. Database as Source of Truth

- Notification **created and persisted to CockroachDB first** (immediately)
- Socket.io emission happens **after** DB persistence
- If Socket.io fails or user offline:
  - ✓ Notification still exists in database
  - ✓ User receives it when they reconnect/reopen app
  - ✓ No notifications lost
- Frontend can:
  - Get real-time updates via Socket.io
  - Fetch missed notifications via API on reconnect/app open

### 3. Notification Flow

```
User A (Instructor) creates assignment
        ↓
AssignmentsService.createAssignment()
        ↓
NotificationService.createNotification(instructorId=A, studentId=B, type=SUBMITTED)
        ↓
[1] Prisma: INSERT notification (CockroachDB)
[2] NotificationsGateway.emitToUser(B, notification)
[3] Socket.io: Emit to room user_B
[4] Connected clients in room user_B receive event instantly
        ↓
Student B's browser receives 'notification:new' event
        ↓
useNotifications hook updates state
        ↓
NotificationBell and NotificationDropdown re-render
        ↓
User sees notification instantly (< 100ms typically)

BUT IF Student B is offline:
- [1] Notification saved in database ✓
- [3][4] Socket.io emit fails (no connection)
- When Student B opens app / reconnects:
  - API GET /notifications retrieves from DB ✓
  - User sees all missed notifications
```

### 4. Batch Notifications for Enrolled Students

Example: Instructor publishes announcement to 50 enrolled students

```typescript
// In AnnouncementsService.publish()
const enrollments = await this.prisma.enrollment.findMany({
  where: { courseId },
  select: { studentId: true }
});

// Create notifications for all students
const notifications = await Promise.all(
  enrollments.map(e => 
    this.notificationService.createNotification(
      userId: e.studentId,
      type: ANNOUNCEMENT_PUBLISHED,
      title: announcement.title,
      // ... etc
    )
  )
);

// Each createNotification() call:
// [1] Persists to DB
// [2] Emits via Socket.io to user_${studentId}
// Result: All 50 students see notification in real-time (if connected)
```

---

## Implementation Timeline (Updated)

| Phase | Duration | Goal | Technologies |
|-------|----------|------|---------------|
| **Stage 1** | 5-6 days | Backend service, gateway, API with JWT Socket.io auth | NestJS, Socket.io, Prisma, JWT |
| **Stage 2** | 4-5 days | Integrate notification triggers into existing services | NotificationService injection, event handlers |
| **Stage 3** | 3-4 days | Frontend UI with real-time Socket.io hook | React, Socket.io-client, Tailwind |
| **Stage 4** | 2-3 days | E2E testing, optimization, documentation | Jest, E2E tests, performance tuning |
| **Total** | **14-18 days** | Shipped: Real-time notification system | - |

---

## Dependencies to Install

```bash
# Backend
npm install @nestjs/websockets socket.io @types/socket.io

# Frontend
npm install socket.io-client
```

**No other dependencies needed.** Leverages existing:
- `@nestjs/jwt` (JWT validation)
- `@nestjs/common` (guards, decorators)
- `@prisma/client` (persistence)

---

## Socket.io Gateway Architecture

### File Structure
```
backend/src/notifications/
├── notifications.module.ts      (imports: JwtModule, PrismaModule, Gateway)
├── notifications.service.ts     (handles: createNotification, getNotifications, etc.)
├── notifications.controller.ts  (routes: /notifications endpoints with JwtAuthGuard)
├── notifications.gateway.ts     (WebSocket: JWT auth, room routing, emit methods)
├── dto/
│   ├── create-notification.dto.ts
│   └── get-notifications-response.dto.ts
└── tests/
    ├── notifications.service.spec.ts
    └── notifications.gateway.spec.ts
```

### Gateway Responsibilities
1. **Connection:** Validate JWT token, join user-specific room
2. **Disconnection:** Log disconnect (client may reconnect)
3. **Emission:** `emitToUser(userId, notification)` sends to user's room
4. **Unread Count:** `emitUnreadCountUpdate(userId, count)` updates badge

### Service Responsibilities
1. **Create:** Save to DB + call gateway.emitToUser()
2. **Get:** Query DB with pagination
3. **Mark Read:** Update DB, emit count update
4. **Delete:** Remove from DB

### Controller Responsibilities
1. **GET /notifications** → Service.getNotifications()
2. **GET /notifications/unread-count** → Service.getUnreadCount()
3. **PATCH /notifications/:id/read** → Service.markAsRead()
4. **DELETE /notifications/:id** → Service.deleteNotification()

---

## Frontend Socket.io Hook

### `useNotifications()` Implementation Pattern

```typescript
// frontend/src/hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

export function useNotifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Initialize Socket.io connection
    const socket = io('http://localhost:4000/notifications', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Real-time: New notification received
    socket.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      // Unread count will update via separate event
    });

    // Real-time: Unread count changed
    socket.on('unread-count:update', (data) => {
      setUnreadCount(data.unreadCount);
    });

    // Connection status
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Initial load: Fetch from API (for page refresh / app open)
    const fetchInitial = async () => {
      try {
        const response = await fetch(
          'http://localhost:4000/notifications?limit=20',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        setNotifications(data.data || []);
        
        const countResponse = await fetch(
          'http://localhost:4000/notifications/unread-count',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const countData = await countResponse.json();
        setUnreadCount(countData.unreadCount);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };

    void fetchInitial();

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return { notifications, unreadCount, isConnected };
}
```

### Usage in Components

```typescript
// NotificationBell.tsx
function NotificationBell() {
  const { unreadCount, isConnected } = useNotifications();
  
  return (
    <button className="relative">
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      {!isConnected && <span className="text-xs text-yellow-500">(reconnecting...)</span>}
    </button>
  );
}
```

---

## Testing Strategy (Updated for Socket.io)

### Unit Tests (NotificationService)
- ✓ Create notification (DB + service logic)
- ✓ Get notifications with pagination
- ✓ Get unread count
- ✓ Mark as read, mark all as read
- ✓ Delete notification
- ✓ RBAC enforcement

### Gateway Tests (Socket.io)
- ✓ Valid JWT token → connection established
- ✓ Invalid/expired JWT → connection rejected
- ✓ Connected socket joins room `user_${userId}`
- ✓ `emitToUser()` sends to correct room only
- ✓ Multiple sockets for same user receive broadcast
- ✓ Disconnected socket leaves room

### Integration Tests (Trigger + Real-Time)
- ✓ Assignment submission → NotificationService called → Socket.io emits
- ✓ Announcement published → Batch notifications created + emitted
- ✓ Live session created → Notification emitted to enrolled students
- ✓ Grade submission → Notification emitted to student (not instructor)

### Frontend Component Tests (Socket.io)
- ✓ Hook connects on mount with token
- ✓ Hook listens for `notification:new` event
- ✓ Hook listens for `unread-count:update` event
- ✓ Notification bell displays unread count
- ✓ Notification dropdown updates in real-time
- ✓ Click notification marks as read

### E2E Tests (Full Flow)
- ✓ Create assignment → Instructor Socket.io connected → Notification appears instantly
- ✓ Grade assignment → Student Socket.io connected → Notification appears instantly
- ✓ Student offline → Assignment submitted → Notification in DB → Student opens app → Notification appears

---

## Security Verification Checklist

Before shipping Stage 1:

- [ ] JWT token required for Socket.io connection (connection fails without token)
- [ ] Expired JWT tokens disconnect socket immediately
- [ ] UserId extracted from verified JWT only (not from client query/data)
- [ ] Each user has isolated room `user_${userId}` with no cross-access
- [ ] `emitToUser()` sends only to the correct room
- [ ] Student cannot join instructor room (no manual room joining allowed)
- [ ] Instructor cannot access student room (no room enumeration)
- [ ] API endpoints (GET /notifications) also enforce same userId check
- [ ] No global "admin" or "broadcast" channels available
- [ ] Unauthorized Socket.io connections rejected at middleware
- [ ] Rate limiting on Socket.io events (prevent spam)

---

## Known Limitations (Out of Scope for MVP)

1. **Offline-First PWA** — Service Worker caching not included (Phase 3)
2. **Notification Preferences** — All notification types enabled by default (Phase 2)
3. **Email/SMS** — Not included (Phase 3 with external service)
4. **Push Notifications** — Firebase not configured (Phase 3)
5. **Scheduled Reminders** — No background job scheduler (Phase 4)
6. **Notification Groups/Aggregation** — Each notification individual (Phase 2)
7. **Admin Dashboard** — No admin notification panel (Phase 2)

---

## What's Included in MVP

✓ **Real-time Socket.io with JWT auth**
✓ **Persistent database (source of truth)**
✓ **10 notification types supported**
✓ **API for fetching historical notifications**
✓ **Notification bell with unread badge**
✓ **Dropdown and full notifications page**
✓ **Real-time updates in UI**
✓ **Offline-safe (DB persistence)**
✓ **RBAC enforcement (instructor/student isolation)**
✓ **Comprehensive test coverage**

---

## Next Steps

1. **Review & Approve:** Confirm Socket.io + JWT architecture meets requirements
2. **Stage 1:** Implement NotificationService + NotificationsGateway (5-6 days)
3. **Stage 2:** Integrate triggers (4-5 days)
4. **Stage 3:** Frontend UI with Socket.io hook (3-4 days)
5. **Stage 4:** Testing & documentation (2-3 days)

**Total:** 14-18 days to shipped product.

---

**Document Status:** Complete - Ready for Implementation Review

