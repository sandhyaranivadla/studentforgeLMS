# Instructor Announcements Feature - Architecture Inspection Report

## Executive Summary
The StudentForge LMS is architecturally **well-prepared** for the Announcements feature. Existing patterns, RBAC controls, and database relationships can be cleanly leveraged without modifying core functionality.

---

## A. EXISTING ARCHITECTURE RELEVANT TO ANNOUNCEMENTS

### Backend Architecture (NestJS)
- **Modular structure**: Each feature is a separate module (Courses, Assignments, Quizzes, etc.)
- **Service-Controller-DTO pattern**: Standard CRUD with business logic in services
- **Database**: Prisma ORM with CockroachDB (distributed SQL)
- **Authentication**: JWT with JwtAuthGuard
- **Authorization**: RolesGuard with @Roles decorator
- **Error handling**: Standard NestJS exceptions (NotFoundException, ForbiddenException, etc.)

### Frontend Architecture (Next.js + React)
- **App Router**: Next.js 16 with dynamic routes and layouts
- **Component-based**: Reusable components for UI sections (AssignmentList, QuizList, etc.)
- **Authentication Context**: useAuth() hook for token and user data
- **API Communication**: Fetch API with Bearer token authentication
- **State Management**: React hooks (useState, useEffect, useCallback)
- **Styling**: Tailwind CSS with responsive design

### Existing Modules
```
Backend:
  src/
    ├── courses/          (CRUD, ownership validation)
    ├── assignments/      (CRUD + submissions + grading)
    ├── quizzes/         (CRUD + questions + attempts + grading)
    ├── live-sessions/   (CRUD + Zoom integration)
    ├── analytics/       (Data aggregation, RBAC)
    ├── auth/            (JWT, guards, decorators)
    ├── enrollments/     (Student-course mapping)
    ├── progress/        (Lesson completion tracking)
    └── users/           (User management)

Frontend:
  src/app/
    ├── dashboard/
    │   ├── instructor/  (Course management UI)
    │   └── student/     (Learning dashboard)
    └── learn/
        └── [courseId]/  (Course learning interface)
```

---

## B. EXISTING FILES THAT SHOULD BE REUSED

### 1. **Prisma Service** (`backend/src/prisma/prisma.service.ts`)
- Already configured for all database operations
- No additional setup needed

### 2. **Authentication Guards**
- `backend/src/auth/guards/jwt-auth.guard.ts` - JWT validation
- `backend/src/auth/guards/roles.guard.ts` - Role-based access control
- **Pattern**: @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(Role.INSTRUCTOR, Role.ADMIN)

### 3. **RBAC Decorator** (`backend/src/auth/decorators/roles.decorator.ts`)
- Reuse for announcements endpoint protection

### 4. **Course Ownership Validation Pattern**
- From `backend/src/courses/courses.service.ts`:
  ```typescript
  if (userRole !== Role.ADMIN && course.instructorId !== userId) {
    throw new ForbiddenException('You can only... your own courses');
  }
  ```

### 5. **Enrollment Lookup Pattern**
- From `backend/src/assignments/assignments.service.ts`:
  ```typescript
  const enrollment = await this.prisma.enrollment.findFirst({
    where: { studentId, courseId }
  });
  ```

### 6. **DTO Validation**
- Use `class-validator` for input validation (existing pattern)
- Create announcement DTOs following existing patterns

### 7. **Frontend Component Patterns**
- `frontend/src/app/dashboard/instructor/components/AssignmentList.tsx`
- Use as template for AnnouncementList component
- Same state management (useState, useEffect)
- Same API fetching pattern (Bearer token)
- Same UI patterns (forms, lists, modals)

### 8. **Frontend Styling**
- Tailwind CSS classes already in use
- Lucide icons (lucide-react) for UI elements
- Consistent color scheme (neutral-900, blue-600, etc.)

---

## C. NEW DATABASE MODEL REQUIRED

### YES - Announcement Model Needed

**Reason**: Announcements are a distinct content type with specific properties that don't fit existing models.

### Recommended Schema

```prisma
model Announcement {
  id           String    @id @default(uuid())
  courseId     String
  instructorId String
  
  title        String
  content      String    // Rich text or markdown
  status       AnnouncementStatus @default(DRAFT)
  
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  publishedAt  DateTime?
  
  course       Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
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

---

## D. RECOMMENDED ANNOUNCEMENT SCHEMA & RELATIONSHIPS

### Core Fields
- **id**: UUID (standard)
- **courseId**: Foreign key to Course (required)
- **instructorId**: Foreign key to User/Instructor (required, for ownership)
- **title**: String (required, max 200 chars)
- **content**: String (required, up to 5000 chars)
- **status**: Enum (DRAFT | PUBLISHED) - allows draft/save functionality
- **createdAt**: Timestamp (auto-generated)
- **updatedAt**: Timestamp (auto-updated)
- **publishedAt**: Timestamp (nullable, set when status changes to PUBLISHED)

### Relationships
```
Announcement ← (courseId) → Course
Announcement ← (instructorId) → User

Course has many Announcements
User(Instructor) has many Announcements
```

### Indexes
- `courseId` - for filtering by course
- `instructorId` - for filtering by instructor
- `publishedAt` - for sorting announcements (newest first)
- `status` - for filtering published vs draft

### Why This Design
1. **Simplicity**: Single model, no join tables needed
2. **Performance**: Indexed on common query patterns
3. **Reuses relationships**: Course and User already exist
4. **Status field**: Supports draft/publish workflow
5. **Timestamps**: Track creation, updates, and publication timing
6. **No cascade delete needed**: Announcements are course-specific content

---

## E. REQUIRED BACKEND APIS

### Announcement Endpoints

#### Create Announcement (Instructor/Admin)
```
POST /announcements
Headers: Authorization: Bearer <token>
Body: { courseId, title, content, status }
Access: INSTRUCTOR (owns course) | ADMIN
Returns: Announcement
```

#### Get Announcements by Course (Instructor/Admin)
```
GET /announcements?courseId=<id>
Headers: Authorization: Bearer <token>
Access: INSTRUCTOR (owns course) | ADMIN
Returns: Announcement[]
Note: Returns all (draft + published)
```

#### Get Published Announcements by Course (Students/Public)
```
GET /announcements/published?courseId=<id>
Headers: Authorization: Bearer <token>
Access: STUDENT (must be enrolled) | INSTRUCTOR | ADMIN
Returns: Announcement[] (published only)
Note: Students only see published announcements
```

#### Get Single Announcement (Authenticated)
```
GET /announcements/:id
Headers: Authorization: Bearer <token>
Access: INSTRUCTOR (owns) | STUDENT (enrolled) | ADMIN
Returns: Announcement
```

#### Update Announcement (Instructor/Admin)
```
PATCH /announcements/:id
Headers: Authorization: Bearer <token>
Body: { title, content, status }
Access: INSTRUCTOR (owns) | ADMIN
Returns: Announcement
```

#### Delete Announcement (Instructor/Admin)
```
DELETE /announcements/:id
Headers: Authorization: Bearer <token>
Access: INSTRUCTOR (owns) | ADMIN
Returns: { success: true }
```

### Total Endpoints: 6

### Note on Query Parameter
- Some frameworks prefer `?courseId=xyz` (assignment pattern)
- Could also use `/courses/:courseId/announcements` (nested route)
- Recommend `/announcements?courseId=xyz` for consistency with existing assignments

---

## F. REQUIRED DTOs

### 1. CreateAnnouncementDto
```typescript
@IsString()
@IsNotEmpty()
title: string;

@IsString()
@IsNotEmpty()
content: string;

@IsString()
@IsNotEmpty()
courseId: string;

@IsEnum(AnnouncementStatus)
@IsOptional()
status?: AnnouncementStatus; // default: DRAFT
```

### 2. UpdateAnnouncementDto
```typescript
@IsString()
@IsOptional()
title?: string;

@IsString()
@IsOptional()
content?: string;

@IsEnum(AnnouncementStatus)
@IsOptional()
status?: AnnouncementStatus;
```

### 3. AnnouncementResponseDto
```typescript
id: string;
courseId: string;
instructorId: string;
title: string;
content: string;
status: AnnouncementStatus;
createdAt: Date;
updatedAt: Date;
publishedAt: Date | null;
instructor: { id: string; name: string; email: string };
```

---

## G. REQUIRED FRONTEND PAGES/COMPONENTS

### Instructor Portal Components

#### 1. AnnouncementsList.tsx (in `/dashboard/instructor/components/`)
- List all announcements for a course (draft + published)
- Show status badge (DRAFT | PUBLISHED)
- Create announcement button
- Edit/Delete buttons for each announcement
- Form for creating new announcements
- Timestamps display

#### 2. AnnouncementForm.tsx (modal or inline form)
- Title input field
- Content textarea (with markdown or rich text preview)
- Status toggle (DRAFT | PUBLISH)
- Save & Publish buttons
- Cancel button
- Validation feedback

### Student Course View Components

#### 1. AnnouncementsFeed.tsx (in `/learn/[courseId]/` or sidebar)
- Display published announcements only
- Sorted by publishedAt (newest first)
- Show title, content preview, publication date
- Show instructor name
- Non-editable view (students can only read)
- Optional: Expand to read full content

### Location in UI

**Instructor Portal** (`/dashboard/instructor/page.tsx`):
- Add AnnouncementsList as a new section in each course
- Similar to existing AssignmentList, QuizList, LiveClassList
- Show in expanded course section

**Student Learning Page** (`/learn/[courseId]/page.tsx`):
- Add AnnouncementsFeed in sidebar or top of course content
- Show recent announcements
- Visible before modules/lessons

---

## H. INSTRUCTOR WORKFLOW

### Step 1: Create Announcement (Draft)
1. Navigate to instructor dashboard
2. Expand a course
3. Scroll to Announcements section
4. Click "Add Announcement"
5. Fill in title and content
6. Choose status: DRAFT (default)
7. Click "Save as Draft"
8. Announcement saved, not visible to students

### Step 2: Edit Draft
1. In Announcements section, find announcement in list
2. Click Edit button
3. Modify title/content
4. Save again (remains DRAFT)

### Step 3: Publish Announcement
1. In draft announcement, change status to PUBLISHED
2. Click "Publish"
3. `publishedAt` timestamp is set
4. Announcement now visible to enrolled students

### Step 4: View/Delete
1. Instructors see all their announcements (draft + published)
2. Can delete any announcement at any time
3. Can see publication status and timestamps

### Data Shown to Instructor
- Created date
- Updated date
- Published date (if applicable)
- Status (DRAFT | PUBLISHED)
- Student visibility info

---

## I. STUDENT WORKFLOW

### Step 1: View Announcements
1. Student enrolls in course
2. Navigates to `/learn/courseId`
3. AnnouncementsFeed appears at top of course
4. Sees only PUBLISHED announcements

### Step 2: Read Announcement
1. Announcement shows title, content, publication date
2. Shows instructor name
3. Sorted by newest first
4. Read-only (no edit/delete options)

### Step 3: Cannot See Drafts
- Student sees ZERO draft announcements
- Only published announcements visible
- No "draft" indicators shown

### Step 4: Not Enrolled
- Student not enrolled in course: NO access to any announcements
- 403 Forbidden on API call

---

## J. RBAC AND OWNERSHIP RULES

### Authorization Rules Matrix

| Action | STUDENT | INSTRUCTOR (owns) | INSTRUCTOR (other) | ADMIN |
|--------|---------|-------------------|-------------------|-------|
| Create | ❌ | ✅ | ❌ | ✅ |
| Read (own) | ✅* | ✅ | ❌ | ✅ |
| Read (other) | ❌ | ❌ | ❌ | ✅ |
| Update | ❌ | ✅ | ❌ | ✅ |
| Delete | ❌ | ✅ | ❌ | ✅ |
| List drafts | ❌ | ✅ | ❌ | ✅ |
| List published | ✅ | ✅ | ✅ | ✅ |

*STUDENT can only read published announcements in courses they're enrolled in

### Implementation Pattern (from Assignments)

```typescript
// 1. Create
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTRUCTOR, Role.ADMIN)
@Post()
create(...) { ... }

// 2. Service validation
if (userRole !== Role.ADMIN && course.instructorId !== userId) {
  throw new ForbiddenException('You can only create announcements for your own courses');
}

// 3. Read (all)
@UseGuards(JwtAuthGuard)
@Get()
findAllByCourse(...) {
  // For instructors: show all (draft + published)
  // For students: show published only + verify enrollment
  // For admin: show all for any course
}

// 4. Update/Delete
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTRUCTOR, Role.ADMIN)
@Patch(':id')
update(...) {
  // Verify ownership
  if (userRole !== Role.ADMIN && announcement.instructorId !== userId) {
    throw new ForbiddenException(...);
  }
}
```

### Specific Rules for Announcements

1. **Creator**: Only the instructor who created an announcement can edit/delete it
2. **Admin Override**: Admins can edit/delete any announcement in any course
3. **Draft Visibility**: Only creator (instructor) and admins can see draft announcements
4. **Published Visibility**: All enrolled students can see published announcements
5. **Non-Enrolled Students**: Receive 403 Forbidden when trying to access announcements for courses they're not enrolled in
6. **Cross-Instructor Protection**: Instructors cannot access announcements from other instructors' courses

---

## K. VALIDATION AND ERROR-HANDLING REQUIREMENTS

### Input Validation (DTOs)

```typescript
// CreateAnnouncementDto
- title: required, string, 5-200 chars
- content: required, string, 10-5000 chars
- courseId: required, valid UUID format
- status: optional, enum (DRAFT | PUBLISHED)
```

### Business Logic Validation

1. **Course Existence**: Verify courseId exists
2. **Course Ownership**: Verify instructor owns the course (unless admin)
3. **Enrollment Check**: For students reading, verify enrollment in course
4. **Status Transition**: DRAFT → PUBLISHED allowed, PUBLISHED → DRAFT allowed
5. **Timestamp Logic**: publishedAt only set when status = PUBLISHED

### Error Responses

```typescript
// 400 Bad Request
{
  "statusCode": 400,
  "message": "Title must be between 5 and 200 characters"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "You can only create announcements for your own courses"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Announcement not found"
}
```

### Specific Errors to Handle

1. **NonexistentCourse**: NotFoundException
2. **UnauthorizedInstructor**: ForbiddenException
3. **StudentNotEnrolled**: ForbiddenException
4. **AnnouncementNotFound**: NotFoundException
5. **InvalidStatus**: BadRequestException
6. **InvalidDates**: BadRequestException (if custom date logic added)

---

## L. TEST CASES

### Backend Unit Tests (Jest)

#### Service Layer Tests

1. **Create Announcement**
   - ✅ Instructor creates announcement for own course
   - ❌ Instructor creates for other instructor's course (ForbiddenException)
   - ✅ Admin creates for any course
   - ❌ Student creates announcement (no access)
   - ❌ Invalid courseId (NotFoundException)

2. **Read Announcements**
   - ✅ Instructor reads own course announcements (all)
   - ✅ Instructor reads own course published announcements
   - ✅ Admin reads any course announcements
   - ✅ Student reads published announcements (enrolled course only)
   - ❌ Student reads draft announcements (ForbiddenException)
   - ❌ Student reads announcements for non-enrolled course (ForbiddenException)

3. **Update Announcement**
   - ✅ Instructor updates own announcement
   - ❌ Instructor updates other instructor's announcement (ForbiddenException)
   - ✅ Admin updates any announcement
   - ❌ Student updates announcement (ForbiddenException)

4. **Delete Announcement**
   - ✅ Instructor deletes own announcement
   - ❌ Instructor deletes other instructor's announcement (ForbiddenException)
   - ✅ Admin deletes any announcement
   - ❌ Student deletes announcement (ForbiddenException)

5. **Status Transitions**
   - ✅ DRAFT → PUBLISHED (publishedAt timestamp set)
   - ✅ PUBLISHED → DRAFT (publishedAt remains)
   - ✅ Multiple status changes

6. **Filtering & Sorting**
   - ✅ Filter by course
   - ✅ Filter by instructor
   - ✅ Filter by status (DRAFT | PUBLISHED)
   - ✅ Sort by publishedAt (newest first)

#### Controller Layer Tests

1. **Endpoint Access Control**
   - ✅ Unauthenticated request (401 Unauthorized)
   - ✅ Invalid JWT token (401 Unauthorized)
   - ✅ Student accesses create endpoint (403 Forbidden)

### Frontend Component Tests (React Testing Library)

1. **AnnouncementList Component**
   - ✅ Displays announcements from API
   - ✅ Shows create form on "Add Announcement" click
   - ✅ Creates new announcement
   - ✅ Edits existing announcement
   - ✅ Deletes announcement with confirmation
   - ✅ Shows loading state while fetching
   - ✅ Shows error message on API failure

2. **AnnouncementsFeed Component (Student View)**
   - ✅ Displays published announcements only
   - ✅ Sorted by newest first
   - ✅ Shows instructor name
   - ✅ No edit/delete buttons for students
   - ✅ Shows empty state when no announcements

### Integration Tests

1. **Full Workflow**
   - ✅ Create draft → Update → Publish → Student sees it
   - ✅ Delete published announcement → Student no longer sees it
   - ✅ Verify timestamps are correct

---

## M. DATABASE MIGRATION REQUIREMENTS

### Prisma Migration Steps

1. **Add Model to schema.prisma**
   ```prisma
   model Announcement {
     // fields as defined in section D
   }
   
   enum AnnouncementStatus {
     DRAFT
     PUBLISHED
   }
   
   // Update Course model
   model Course {
     // existing fields...
     announcements Announcement[]
   }
   
   // Update User model
   model User {
     // existing fields...
     announcements Announcement[] @relation("InstructorAnnouncements")
   }
   ```

2. **Create Migration**
   ```bash
   npx prisma migrate dev --name add_announcements
   ```

3. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Migration File**
   - Auto-generated by Prisma
   - Creates `announcements` table with proper foreign keys and indexes
   - Safe to run (CockroachDB compatible)

### No Data Migration Needed
- Greenfield feature (no existing announcement data)
- No schema changes to existing tables
- Can deploy during maintenance or live (non-breaking)

---

## N. IMPLEMENTATION STEPS (SAFE STAGES)

### Stage 1: Database & Backend Service (Database Migration)
1. Add Announcement model to schema.prisma
2. Add AnnouncementStatus enum to schema.prisma
3. Add announcements relation to Course and User
4. Run: `npx prisma migrate dev --name add_announcements`
5. Run: `npx prisma generate`
6. Create announcements directory: `backend/src/announcements/`
7. Create AnnouncementsService with full CRUD methods
8. Write service unit tests
9. Verify all tests pass

### Stage 2: Backend API (Controllers & DTOs)
1. Create DTOs in `backend/src/announcements/dto/`
   - CreateAnnouncementDto
   - UpdateAnnouncementDto
   - AnnouncementResponseDto
2. Create AnnouncementsController with all 6 endpoints
3. Implement RBAC using existing guards
4. Add comprehensive error handling
5. Write controller tests
6. Verify all tests pass

### Stage 3: Backend Module & Integration
1. Create AnnouncementsModule
2. Register in app.module.ts
3. Build and compile: `npm run build`
4. Run ESLint: `npm run lint`
5. Run full test suite: `npm run test`
6. Verify no breaking changes to existing features

### Stage 4: Frontend - Instructor Components
1. Create `frontend/src/app/dashboard/instructor/components/AnnouncementList.tsx`
2. Create `frontend/src/app/dashboard/instructor/components/AnnouncementForm.tsx`
3. Update `frontend/src/app/dashboard/instructor/page.tsx` to include AnnouncementList
4. Test create/edit/delete flow manually
5. Add error handling and loading states
6. Verify TypeScript compilation

### Stage 5: Frontend - Student Components
1. Create `frontend/src/app/learn/[courseId]/components/AnnouncementsFeed.tsx`
2. Update `frontend/src/app/learn/[courseId]/page.tsx` to include AnnouncementsFeed
3. Verify students see only published announcements
4. Test enrollment check (non-enrolled students get error)
5. Verify TypeScript compilation

### Stage 6: Testing & Verification
1. Backend: Run full Jest test suite
2. Frontend: Build production build
3. Frontend: Run ESLint
4. Integration: Test full workflow (create → publish → student sees)
5. Security: Test RBAC rules (all matrix cases)
6. Error cases: Test all error scenarios

### Stage 7: Documentation & Cleanup
1. Update API documentation (if applicable)
2. Add inline code comments
3. Remove any console logs
4. Verify no unrelated files modified
5. Clean up any temporary test files

---

## RISK ASSESSMENT

### Low Risk
✅ Uses existing RBAC patterns (proven, tested)
✅ Simple data model (no complex relationships)
✅ No modifications to existing core models
✅ Follows established coding patterns
✅ No new external dependencies
✅ Database migration is straightforward (Prisma)

### Medium Risk
⚠️ New API endpoints (need thorough testing)
⚠️ Frontend-backend integration (coordinate deployment)

### No Risk
✅ Backward compatible (new table, no schema changes)
✅ Non-blocking (can disable feature without impact)
✅ No changes to auth system
✅ No changes to existing student workflows (unless they want announcements)

---

## ARCHITECTURE ALIGNMENT CHECKLIST

- [x] Uses existing Course model (reuse instructorId relationship)
- [x] Uses existing User model (reuse instructor tracking)
- [x] Uses existing Enrollment model (for student visibility checks)
- [x] Follows service-controller-DTO pattern
- [x] Uses JwtAuthGuard for authentication
- [x] Uses RolesGuard for authorization
- [x] Uses @Roles decorator for granular access control
- [x] Uses class-validator for DTO validation
- [x] Follows NestJS best practices
- [x] No new dependencies required
- [x] No modifications to unrelated features
- [x] Frontend follows existing component patterns
- [x] Frontend uses existing styling (Tailwind CSS)
- [x] Frontend uses existing API communication pattern (Bearer token)
- [x] Database migration uses Prisma standard
- [x] No breaking changes to existing code

---

## READY FOR IMPLEMENTATION

**✅ YES - ARCHITECTURE SUPPORTS THIS FEATURE CLEANLY**

### Summary
The StudentForge LMS has a mature, well-structured architecture that is **fully prepared** for the Announcements feature. All necessary infrastructure exists (RBAC, service patterns, DTOs, frontend components, database ORM). The feature can be implemented following established patterns without any disruption to existing functionality.

### Prerequisites Met
- ✅ RBAC system in place and proven
- ✅ Course-instructor relationship established
- ✅ Student enrollment tracking available
- ✅ Service-controller-DTO patterns established
- ✅ Frontend component patterns established
- ✅ Database ORM and migrations ready
- ✅ Authentication infrastructure mature

### Recommendation
Proceed with **Phase-based implementation** as outlined in Section N. Start with database migration, then build service layer, then API endpoints, then frontend components. Each stage has clear tests and verification steps.

---

**Report Prepared**: August 2026
**Status**: Ready for Implementation Approval
