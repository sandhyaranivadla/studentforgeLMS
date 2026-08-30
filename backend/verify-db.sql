-- Verify what's actually in the database

-- 1. Check if the course exists with the right ID
SELECT id, title, "instructorId", published FROM "Course" WHERE id = 'b4c64f3f-84c3-4412-96fb-79d49dd70243';

-- 2. Check all courses
SELECT id, title, "instructorId" FROM "Course" LIMIT 10;

-- 3. Check if instructor user exists
SELECT id, email, role FROM "User" WHERE id = 'instructor-123';

-- 4. Check all users
SELECT id, email, role FROM "User" LIMIT 10;

-- 5. Count assignments for the course
SELECT COUNT(*) as assignment_count FROM "Assignment" WHERE "courseId" = 'b4c64f3f-84c3-4412-96fb-79d49dd70243';

-- 6. Check assignments
SELECT id, title, "courseId" FROM "Assignment" LIMIT 10;

-- 7. Check quizzes
SELECT id, title, "courseId" FROM "Quiz" LIMIT 10;

-- 8. Check live sessions
SELECT id, title, "courseId" FROM "LiveSession" LIMIT 10;

-- 9. Check announcements
SELECT id, title, "courseId" FROM "Announcement" LIMIT 10;
