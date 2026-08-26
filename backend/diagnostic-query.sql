-- Diagnostic query to check course ownership and instructor relationships

-- 1. List all courses with instructor details
SELECT 
  c.id as course_id,
  c.title,
  c."instructorId",
  u.id as instructor_id,
  u.email as instructor_email,
  u.name as instructor_name,
  u.role
FROM "Course" c
LEFT JOIN "User" u ON c."instructorId" = u.id
ORDER BY c."createdAt" DESC;

-- 2. List all users (especially instructors)
SELECT 
  id,
  email,
  name,
  role,
  "createdAt"
FROM "User"
ORDER BY role, "createdAt";

-- 3. Check specific course if exists
SELECT 
  c.id,
  c.title,
  c."instructorId",
  (SELECT COUNT(*) FROM "Assignment" WHERE "courseId" = c.id) as assignment_count,
  (SELECT COUNT(*) FROM "Quiz" WHERE "courseId" = c.id) as quiz_count,
  (SELECT COUNT(*) FROM "LiveSession" WHERE "courseId" = c.id) as live_session_count,
  (SELECT COUNT(*) FROM "Announcement" WHERE "courseId" = c.id) as announcement_count,
  (SELECT COUNT(*) FROM "Enrollment" WHERE "courseId" = c.id) as enrollment_count
FROM "Course" c;

-- 4. Check what assignments exist
SELECT 
  a.id,
  a.title,
  a."courseId",
  c.title as course_title,
  c."instructorId"
FROM "Assignment" a
JOIN "Course" c ON a."courseId" = c.id
LIMIT 10;
