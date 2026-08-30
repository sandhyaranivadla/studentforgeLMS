-- Delete all existing data (in correct order due to foreign keys)
DELETE FROM "StudentQuizAnswer";
DELETE FROM "QuizAttempt";
DELETE FROM "QuizOption";
DELETE FROM "QuizQuestion";
DELETE FROM "AssignmentSubmission";
DELETE FROM "Assignment";
DELETE FROM "Message";
DELETE FROM "Notification";
DELETE FROM "Announcement";
DELETE FROM "LiveSession";
DELETE FROM "LessonProgress";
DELETE FROM "Lesson";
DELETE FROM "Quiz";
DELETE FROM "CourseModule";
DELETE FROM "Enrollment";
DELETE FROM "Course";
DELETE FROM "User";
