# Announcements Feature - Quick Reference

## Database Schema

```prisma
model Announcement {
  id           String    @id @default(uuid())
  courseId     String
  instructorId String
  
  title        String
  content      String
  status       AnnouncementStatus @default(DRAFT)
  
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  publishedAt  DateTime?
  
  course       Course    @relation(fields: [courseId], references: [id])
  instructor   User      @relation(fields: [instructorId], references: [id])
  
  @@index([courseId])
  @@index([instructorId])
  @@index([publishedAt])
  @@index([status])
}

enum AnnouncementStatus {
  DRAFT
  PUBLISHED
}
```

## API Endpoints (6 total)

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/announcements` | INSTRUCTOR, ADMIN | Create announcement |
| GET | `/announcements?courseId=X` | INSTRUCTOR, ADMIN | List all announcements (draft + pub) |
| GET | `/announcements/published?courseId=X` | STUDENT, INSTRUCTOR, ADMIN | List published only |
| GET | `/announcements/:id` | Enrolled student, INSTRUCTOR, ADMIN | Read single |
| PATCH | `/announcements/:id` | INSTRUCTOR (owner), ADMIN | Update |
| DELETE | `/announcements/:id` | INSTRUCTOR (owner), ADMIN | Delete |

## RBAC Matrix

```
Action      Student  Instructor(own)  Instructor(other)  Admin
Create      ❌       ✅               ❌                 ✅
Read(pub)   ✅*      ✅               ✅                 ✅
Read(all)   ❌       ✅               ❌                 ✅
Update      ❌       ✅               ❌                 ✅
Delete      ❌       ✅               ❌                 ✅

* = Only if enrolled in course
```

## File Structure to Create

### Backend

```
backend/src/announcements/
├── announcements.service.ts       (Service with CRUD logic)
├── announcements.controller.ts    (6 endpoints)
├── announcements.module.ts        (Module definition)
├── dto/
│   ├── create-announcement.dto.ts
│   └── update-announcement.dto.ts
└── announcements.service.spec.ts  (Unit tests)
```

### Frontend

```
frontend/src/app/
├── dashboard/instructor/components/
│   ├── AnnouncementList.tsx       (List, create, edit, delete)
│   └── AnnouncementForm.tsx       (Create/edit form)
└── learn/[courseId]/components/
    └── AnnouncementsFeed.tsx      (Student read-only view)
```

## Frontend Integration Points

### Instructor Portal
Location: `frontend/src/app/dashboard/instructor/page.tsx`

Add in course expansion section:
```tsx
<div className="border-t border-neutral-800 px-4 py-4 bg-neutral-950/30">
  <AnnouncementList courseId={course.id} token={token} />
</div>
```

### Student Learning Page
Location: `frontend/src/app/learn/[courseId]/page.tsx`

Add near top of page:
```tsx
<div className="mb-6">
  <AnnouncementsFeed courseId={courseId} token={token} />
</div>
```

## Key Implementation Patterns (Reuse From)

### RBAC Pattern
→ From: `backend/src/assignments/assignments.service.ts`
```typescript
if (userRole !== Role.ADMIN && course.instructorId !== userId) {
  throw new ForbiddenException('You can only access your own courses');
}
```

### Enrollment Check Pattern
→ From: `backend/src/assignments/assignments.service.ts`
```typescript
const enrollment = await this.prisma.enrollment.findFirst({
  where: { studentId, courseId }
});
if (!enrollment) {
  throw new ForbiddenException('You are not enrolled in this course');
}
```

### Component Pattern
→ From: `frontend/src/app/dashboard/instructor/components/AssignmentList.tsx`
- useState for form visibility
- useEffect for data fetching
- Fetch API with Bearer token
- Error and loading states
- Tailwind CSS styling

## Workflow Diagrams

### Instructor Creating Announcement
```
Instructor Dashboard
  → Expand Course
    → Click "Add Announcement"
      → Fill Title + Content
        → Choose Status (DRAFT or PUBLISH)
          → Save
            ✅ Announcement created (not visible to students if DRAFT)
            ✅ Students can see if PUBLISHED
```

### Student Viewing Announcements
```
Student Learning Page
  → Announcements Feed (at top)
    → Shows PUBLISHED announcements only
      → Sorted by newest first
        → Shows title, content, date, instructor name
          → Read-only (no edit/delete)
```

## Database Indexes for Performance

```prisma
@@index([courseId])        // Filter by course
@@index([instructorId])    // Filter by instructor
@@index([publishedAt])     // Sort by publication date
@@index([status])          // Filter draft vs published
```

## Testing Checklist

### Unit Tests Required
- [ ] Create announcement (own course) - PASS
- [ ] Create announcement (other course) - FAIL (Forbidden)
- [ ] Read announcements (instructor) - all shown
- [ ] Read announcements (student) - published only
- [ ] Student reads announcement (not enrolled) - FAIL
- [ ] Update own announcement - PASS
- [ ] Update other's announcement - FAIL
- [ ] Delete own announcement - PASS
- [ ] Delete other's announcement - FAIL
- [ ] Status transitions work correctly
- [ ] publishedAt timestamp set when published

### Integration Tests Required
- [ ] Full workflow: Create → Edit → Publish → Student sees
- [ ] Delete published announcement → Student no longer sees
- [ ] Enrollment verification blocks non-enrolled students
- [ ] Timestamps display correctly

## Deployment Steps

1. Add schema to `prisma/schema.prisma`
2. Run: `npx prisma migrate dev --name add_announcements`
3. Create backend service/controller/DTO files
4. Add AnnouncementsModule to `app.module.ts`
5. Test backend: `npm run test`, `npm run lint`, `npm run build`
6. Create frontend components
7. Integrate into instructor portal and learning page
8. Test frontend: TypeScript, ESLint, build
9. Full integration testing
10. Deploy

## No Changes Required To
- ✅ Existing models (only adding new Announcement model)
- ✅ Authentication system
- ✅ RBAC system
- ✅ Course system
- ✅ Enrollment system
- ✅ User system
- ✅ Any other feature

## Dependencies
- ✅ All exist already
- No new npm packages required
- Uses: NestJS, Prisma, class-validator, React, Tailwind CSS, Lucide icons
