# Notifications System - Deployment Checklist

## Pre-Deployment Review

### Code Quality
- [ ] All unit tests passing: `npm test -- notifications` (33/33 tests)
- [ ] All E2E tests passing: `npm run test:e2e -- notifications`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] ESLint passing: `npm run lint`
- [ ] Code review completed
- [ ] No hardcoded secrets in code
- [ ] No console.log() statements in production code
- [ ] Error handling comprehensive (no unhandled promise rejections)

### Security Review
- [ ] JWT token validation implemented in Socket.io gateway
- [ ] User ID extracted from verified JWT (not from client)
- [ ] Room isolation verified: `user_${userId}`
- [ ] CORS configured correctly for frontend domain
- [ ] No sensitive data in notification messages
- [ ] Action URLs validated to prevent XSS
- [ ] Database credentials stored in .env (not in code)
- [ ] Rate limiting considered (future enhancement)
- [ ] SQL injection prevention verified (using Prisma ORM)

### Performance Review
- [ ] Database indexes created (5 indexes on Notification table)
- [ ] Pagination implemented (max 100 per page)
- [ ] Batch operations optimized (Promise.all for concurrent creates)
- [ ] Socket.io room isolation prevents broadcast overhead
- [ ] Unread count cached (only emit when changed)
- [ ] No N+1 queries in notification fetches
- [ ] Frontend API calls optimized (no duplicate requests)
- [ ] Frontend state management efficient

### Database
- [ ] Migration file created: `backend/prisma/migrations/add_notifications`
- [ ] Migration tested locally
- [ ] Rollback plan documented
- [ ] Backup strategy in place
- [ ] CockroachDB connection string verified
- [ ] Notification table exists in production database
- [ ] Database user has correct permissions

---

## Backend Deployment

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] .env file created with variables:
  ```env
  DATABASE_URL=<cockroach-prod-connection-string>
  JWT_SECRET=<production-secret>
  JWT_EXPIRATION=7d
  FRONTEND_URL=<production-frontend-url>
  NODE_ENV=production
  LOG_LEVEL=info
  ```
- [ ] All required environment variables set
- [ ] No .env.local or sensitive files committed to git

### Installation & Build
- [ ] Dependencies installed: `npm install`
- [ ] Build successful: `npm run build` (no TypeScript errors)
- [ ] Build output verified: `dist/` directory exists
- [ ] Production bundle size acceptable

### Database Setup
- [ ] Database connection string correct
- [ ] Database user created with minimal permissions
- [ ] Prisma migrations executed: `npx prisma migrate deploy`
- [ ] Migration status checked: `npx prisma migrate status`
- [ ] Notification table exists and has correct schema
- [ ] All 5 indexes created successfully
- [ ] Database connection test successful

### Notifications Module Verification
- [ ] NotificationsService initialized
- [ ] NotificationsGateway initialized
- [ ] NotificationsController routes registered
- [ ] Module imports configured correctly
- [ ] Dependency injection working (no missing providers)

### Service Integration Verification
- [ ] AssignmentsService imports NotificationsService
- [ ] AnnouncementsService imports NotificationsService
- [ ] EnrollmentsService imports NotificationsService
- [ ] All triggers properly implemented
- [ ] No circular dependencies

### Tests on Production
- [ ] Run test suite: `npm test`
- [ ] All notification tests passing
- [ ] No skipped tests
- [ ] Coverage report reviewed

### Server Start
- [ ] Server starts without errors: `npm start`
- [ ] Health check endpoint working
- [ ] Socket.io namespace registered: `/notifications`
- [ ] Logging configured
- [ ] No warnings on startup

---

## Frontend Deployment

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] .env.local file created:
  ```env
  NEXT_PUBLIC_API_URL=<production-backend-url>
  NEXT_PUBLIC_ENV=production
  ```
- [ ] Frontend URL matches CORS configuration on backend
- [ ] All environment variables set

### Installation & Build
- [ ] Dependencies installed: `npm install`
- [ ] Build successful: `npm run build` (no errors/warnings)
- [ ] Build output verified: `.next/` directory exists
- [ ] Production build size acceptable
- [ ] All routes generated successfully:
  - `/dashboard/notifications` page exists
  - No build errors for NotificationBell, NotificationDropdown, NotificationItem

### Socket.io Client Configuration
- [ ] Socket.io-client installed and correct version
- [ ] useNotifications hook imports correct namespace
- [ ] JWT token passed in auth on connection
- [ ] Reconnection settings configured:
  - reconnection: true
  - reconnectionDelay: 1000
  - reconnectionDelayMax: 5000
  - reconnectionAttempts: 5
- [ ] Event listeners registered:
  - notification:new
  - unread-count:update
  - connect
  - disconnect
  - connect_error

### Component Verification
- [ ] NotificationBell component renders without errors
- [ ] NotificationDropdown component renders without errors
- [ ] NotificationItem component renders without errors
- [ ] Notifications page loads successfully
- [ ] No TypeScript errors in components
- [ ] All lucide-react icons available

### Frontend Server Start
- [ ] Server starts: `npm start`
- [ ] Pages load without 404 errors
- [ ] Navigation to `/dashboard/notifications` works
- [ ] No console errors on page load

---

## Integration Testing

### End-to-End Workflow
- [ ] Start backend server (production build)
- [ ] Start frontend server (production build)
- [ ] Login as instructor
- [ ] Verify Socket.io connection:
  - Check `isConnected` state in useNotifications
  - Check browser DevTools → Network → WS for Socket.io connection
- [ ] Verify NotificationBell renders in header
- [ ] Create assignment as instructor
- [ ] Login as student (separate browser/incognito)
- [ ] Submit assignment
- [ ] Verify instructor receives notification:
  - Check database: Notification with ASSIGNMENT_SUBMITTED type
  - Check frontend: Badge updates immediately (real-time)
  - Check dropdown: Notification appears in list

### Cross-Browser Testing
- [ ] Chrome/Edge: Socket.io connects, notifications appear
- [ ] Firefox: Socket.io connects, notifications appear
- [ ] Safari: Socket.io connects, notifications appear
- [ ] Mobile Safari: Socket.io connects, notifications appear
- [ ] Mobile Chrome: Socket.io connects, notifications appear

### Network Condition Testing
- [ ] Simulate 3G connection in DevTools
  - Notifications still delivered (may be delayed)
  - Auto-reconnect works
- [ ] Simulate offline in DevTools
  - Connection lost message shown
  - User can still view notifications via API
  - Notifications persist in database
- [ ] Simulate high latency (2000ms)
  - Notifications eventually delivered
  - No duplicate notifications
- [ ] Toggle network on/off
  - Reconnection works properly
  - New notifications delivered after reconnect

---

## Security Testing

### Authentication
- [ ] Attempt connection without JWT token
  - Should fail: 401 Unauthorized
- [ ] Attempt connection with invalid JWT
  - Should fail: 401 Unauthorized
- [ ] Attempt connection with expired JWT
  - Should fail: 401 Unauthorized
- [ ] Valid JWT connection succeeds

### Authorization
- [ ] Login as student
- [ ] Try to access instructor's notifications via API
  - Should fail: 403 Forbidden (if attempting to delete/mark)
- [ ] Try to access instructor's notifications via Socket.io
  - Should not receive them (room isolation)
- [ ] Login as instructor
- [ ] Verify only seeing own notifications
- [ ] Verify admin cannot see other users' notifications (if applicable)

### Room Isolation
- [ ] Open browser DevTools → Network → WS
- [ ] Verify Socket.io connects to namespace: `/notifications`
- [ ] Verify user joined room: `user_${userId}` (in gateway logs)
- [ ] Open second browser as different user
- [ ] Verify user joined different room: `user_${otherUserId}`
- [ ] Verify no cross-talk between rooms
- [ ] Verify notifications only received in own room

### Data Protection
- [ ] Inspect notification object structure
  - No sensitive data exposed
  - Only necessary fields included
- [ ] Check database directly
  - Notifications stored securely
  - No unencrypted sensitive data
- [ ] Verify HTTPS/WSS in production
  - HTTP upgraded to HTTPS
  - WS upgraded to WSS

---

## Performance Testing

### Load Testing
- [ ] 100 concurrent users connecting
  - All connections succeed
  - No server errors
  - Memory usage acceptable
  - CPU usage < 80%
- [ ] 1000 concurrent notifications created
  - Batch creation completes in < 5 seconds
  - All notifications persisted
  - All users receive notifications

### Latency Testing
- [ ] Average notification delivery time: < 100ms (local network)
- [ ] API response time for fetch: < 200ms
- [ ] Database query time: < 50ms

### Database Performance
- [ ] Query: Fetch 20 notifications
  - Execution time: < 50ms
  - Uses index on userId
- [ ] Batch insert: 1000 notifications
  - Execution time: < 1s
  - All records inserted
- [ ] Count unread: 
  - Execution time: < 20ms
  - Uses index on read=false

### Memory & CPU
- [ ] Backend memory usage: < 500MB baseline
- [ ] Frontend memory usage: < 100MB baseline
- [ ] Backend CPU: < 10% idle, < 50% under load
- [ ] Frontend CPU: < 5% idle, < 30% under load

---

## Monitoring & Logging

### Backend Logging
- [ ] Notification creation logged
- [ ] Socket.io connection logged
- [ ] Socket.io disconnection logged
- [ ] Errors logged with stack traces
- [ ] Log level set to `info` (not `debug` in production)
- [ ] Logs aggregated to central system (if using)

### Database Monitoring
- [ ] Slow query log monitored
- [ ] Connection pool status monitored
- [ ] Disk usage monitored
- [ ] Backup completion verified

### Socket.io Monitoring
- [ ] Connected clients count monitored
- [ ] Connection/disconnection events logged
- [ ] Auth failures logged
- [ ] Error events monitored

### Alert Setup
- [ ] Alert if > 5000 concurrent connections
- [ ] Alert if database query avg > 500ms
- [ ] Alert if memory usage > 80%
- [ ] Alert if error rate > 1%
- [ ] Alert if Socket.io connection failures > 5%

---

## Rollback Plan

### If Issues Found
1. [ ] Identify root cause
2. [ ] Document issue
3. [ ] Revert to previous version:
   ```bash
   git revert <commit-hash>
   npm install
   npm run build
   npm start
   ```
4. [ ] Run tests to verify rollback
5. [ ] Monitor for issues after rollback
6. [ ] Communicate status to team

### Database Rollback
1. [ ] If migration issues:
   ```bash
   npx prisma migrate resolve --rolled-back
   ```
2. [ ] Restore from backup if data loss
3. [ ] Verify data integrity

---

## Post-Deployment

### Verification
- [ ] All tests passing in production environment
- [ ] No error logs in first 1 hour
- [ ] Notifications successfully created and delivered
- [ ] Users can access `/dashboard/notifications` page
- [ ] NotificationBell working in header
- [ ] Real-time updates working (test by creating notification)

### Documentation Update
- [ ] Update README with notifications feature
- [ ] Update API documentation
- [ ] Update deployment guide
- [ ] Notify team of new feature

### Communication
- [ ] Notify users of new notifications feature
- [ ] Send out feature documentation
- [ ] Create help/support articles
- [ ] Set expectations for support team

### Monitoring
- [ ] Monitor error rates for first 24 hours
- [ ] Monitor performance metrics
- [ ] Check user engagement with feature
- [ ] Gather feedback

---

## Rollout Strategy

### Phase 1: Internal Testing (1 day)
- [ ] Deploy to internal staging
- [ ] Team tests feature
- [ ] Feedback collected
- [ ] Issues resolved

### Phase 2: Limited Beta (1 week)
- [ ] Deploy to production with feature flag
- [ ] Limited set of users (~10%)
- [ ] Monitor closely
- [ ] Gather feedback
- [ ] Fix any issues

### Phase 3: Full Rollout (ongoing)
- [ ] Remove feature flag
- [ ] All users receive feature
- [ ] Continue monitoring
- [ ] Support team ready for questions

---

## Success Criteria

- [ ] 100% of all tests passing
- [ ] 0 critical bugs in production
- [ ] Socket.io connections: > 95% success rate
- [ ] Notification delivery latency: < 100ms
- [ ] API response time: < 200ms
- [ ] Database uptime: > 99.9%
- [ ] No data loss
- [ ] No unauthorized access
- [ ] User satisfaction: > 4/5 stars (if applicable)

---

## Sign-Off

- [ ] Developer: _________________ Date: _________
- [ ] QA Lead: _________________ Date: _________
- [ ] DevOps: _________________ Date: _________
- [ ] Product Owner: _________________ Date: _________

---

## Notes

Use this space to document any special configurations, known issues, or additional steps taken during deployment.

```
[Deployment notes here]
```

