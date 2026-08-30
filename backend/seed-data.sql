-- Insert users
INSERT INTO "User" (id, email, "passwordHash", name, role, "createdAt", "updatedAt") VALUES
('admin-123', 'admin@studentforge.com', '$2b$10$hashed_admin_password', 'Admin User', 'ADMIN', now(), now()),
('instructor-123', 'instructor@studentforge.com', '$2b$10$hashed_instructor_password', 'John Instructor', 'INSTRUCTOR', now(), now()),
('student1-123', 'student1@studentforge.com', '$2b$10$hashed_student1_password', 'Alice Student', 'STUDENT', now(), now()),
('student2-123', 'student2@studentforge.com', '$2b$10$hashed_student2_password', 'Bob Student', 'STUDENT', now(), now());

-- Insert course with the specific ID the frontend expects
INSERT INTO "Course" (id, title, description, price, "instructorId", published, thumbnail, "createdAt", "updatedAt") VALUES
('b4c64f3f-84c3-4412-96fb-79d49dd70243', 'Introduction to Web Development', 'Learn the basics of web development with HTML, CSS, and JavaScript', 49.99, 'instructor-123', true, 'https://example.com/course-thumbnail.jpg', now(), now());

-- Insert modules
INSERT INTO "CourseModule" (id, title, "courseId", "orderIndex") VALUES
('module1-123', 'Module 1: HTML Fundamentals', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 1),
('module2-123', 'Module 2: CSS Styling', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 2),
('module3-123', 'Module 3: JavaScript Basics', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 3);

-- Insert lessons
INSERT INTO "Lesson" (id, title, type, duration, "moduleId", "orderIndex", "contentUrl") VALUES
('lesson1-123', 'HTML Basics', 'VIDEO', '30 minutes', 'module1-123', 1, 'https://example.com/html-basics.mp4'),
('lesson2-123', 'HTML Forms', 'PDF', '20 minutes', 'module1-123', 2, 'https://example.com/html-forms.pdf'),
('lesson3-123', 'CSS Selectors', 'VIDEO', '45 minutes', 'module2-123', 1, 'https://example.com/css-selectors.mp4'),
('lesson4-123', 'Responsive Design', 'VIDEO', '50 minutes', 'module2-123', 2, 'https://example.com/responsive-design.mp4');

-- Insert assignments
INSERT INTO "Assignment" (id, "courseId", "moduleId", title, description, instructions, "dueDate", "maxMarks", "createdAt", "updatedAt") VALUES
('assignment1-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 'module1-123', 'Build a Simple HTML Page', 'Create a simple HTML page with proper structure', 'Create an HTML page with header, nav, main, and footer. Include at least 5 semantic HTML elements.', now() + interval '7 days', 100, now(), now()),
('assignment2-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 'module2-123', 'CSS Styling Challenge', 'Style a website using advanced CSS techniques', 'Apply CSS grid, flexbox, and media queries to make a responsive layout.', now() + interval '14 days', 150, now(), now()),
('assignment3-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 'module3-123', 'JavaScript Calculator', 'Build a working calculator using JavaScript', 'Create a functional calculator that can perform basic arithmetic operations.', now() + interval '21 days', 200, now(), now());

-- Insert submissions
INSERT INTO "AssignmentSubmission" (id, "assignmentId", "studentId", "submissionText", marks, feedback, "submittedAt", "gradedAt", "updatedAt") VALUES
('submission1-123', 'assignment1-123', 'student1-123', 'My HTML page: https://example.com/alice-html', 90, 'Great work! Good use of semantic HTML. Work on spacing next time.', now() - interval '2 days', now() - interval '1 day', now()),
('submission2-123', 'assignment1-123', 'student2-123', 'My HTML page: https://example.com/bob-html', 75, 'Good structure, but missing some semantic elements.', now() - interval '3 days', now() - interval '2 days', now()),
('submission3-123', 'assignment2-123', 'student1-123', 'My CSS styled website: https://example.com/alice-css', NULL, NULL, now() - interval '5 days', NULL, now());

-- Insert quizzes
INSERT INTO "Quiz" (id, "courseId", "moduleId", title, description, published, "timeLimit", "passingScore", "showCorrectAnswers", "randomizeQuestions", "createdAt", "updatedAt") VALUES
('quiz1-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 'module1-123', 'HTML Fundamentals Quiz', 'Test your knowledge of HTML basics', true, 30, 60, true, false, now(), now()),
('quiz2-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 'module2-123', 'CSS Styling Quiz', 'Test your CSS knowledge', true, 45, 70, true, true, now(), now());

-- Insert quiz questions
INSERT INTO "QuizQuestion" (id, "quizId", "questionText", marks, "orderIndex", "createdAt", "updatedAt") VALUES
('question1-123', 'quiz1-123', 'What does HTML stand for?', 1, 1, now(), now()),
('question2-123', 'quiz1-123', 'Which tag is used for the largest heading?', 1, 2, now(), now());

-- Insert quiz options
INSERT INTO "QuizOption" (id, "questionId", "optionText", "isCorrect", "orderIndex", "createdAt", "updatedAt") VALUES
('option1-1', 'question1-123', 'Hyper Text Markup Language', true, 1, now(), now()),
('option1-2', 'question1-123', 'High Tech Modern Language', false, 2, now(), now()),
('option2-1', 'question2-123', '<h1>', true, 1, now(), now()),
('option2-2', 'question2-123', '<h6>', false, 2, now(), now());

-- Insert quiz attempts
INSERT INTO "QuizAttempt" (id, "quizId", "studentId", "startedAt", "submittedAt", score, "totalMarks", passing, "createdAt") VALUES
('attempt1-123', 'quiz1-123', 'student1-123', now() - interval '5 days', now() - interval '5 days', 2, 2, true, now()),
('attempt2-123', 'quiz1-123', 'student2-123', now() - interval '4 days', now() - interval '4 days', 1, 2, false, now());

-- Insert student quiz answers
INSERT INTO "StudentQuizAnswer" (id, "attemptId", "questionId", "selectedOptionId", "marksObtained", "createdAt") VALUES
('answer1-123', 'attempt1-123', 'question1-123', 'option1-1', 1, now()),
('answer2-123', 'attempt1-123', 'question2-123', 'option2-1', 1, now());

-- Insert enrollments
INSERT INTO "Enrollment" (id, "studentId", "courseId", progress, status, "createdAt") VALUES
('enrollment1-123', 'student1-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 60, 'ACTIVE', now()),
('enrollment2-123', 'student2-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 40, 'ACTIVE', now());

-- Insert lesson progress
INSERT INTO "LessonProgress" (id, "studentId", "lessonId", "courseId", completed, "completedAt", "lastAccessedAt") VALUES
('progress1-123', 'student1-123', 'lesson1-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', true, now() - interval '3 days', now()),
('progress2-123', 'student1-123', 'lesson2-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', true, now() - interval '2 days', now()),
('progress3-123', 'student2-123', 'lesson1-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', true, now() - interval '4 days', now());

-- Insert announcements
INSERT INTO "Announcement" (id, "courseId", "instructorId", title, content, status, "createdAt", "updatedAt", "publishedAt") VALUES
('announcement1-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 'instructor-123', 'Welcome to Web Development!', 'Welcome to the Introduction to Web Development course. This course will cover HTML, CSS, and JavaScript fundamentals. Let''s build amazing websites together!', 'PUBLISHED', now() - interval '7 days', now(), now() - interval '7 days'),
('announcement2-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 'instructor-123', 'Assignment 1 Grading Complete', 'Great work everyone! I''ve graded the first assignment. Check your submissions for feedback.', 'PUBLISHED', now() - interval '2 days', now(), now() - interval '2 days');

-- Insert live sessions
INSERT INTO "LiveSession" (id, "courseId", "moduleId", title, description, "startTime", "endTime", status, "zoomMeetingId", "createdAt", "updatedAt") VALUES
('session1-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 'module1-123', 'HTML Basics Live Q&A', 'Join us for a live session to discuss HTML basics and answer your questions', now() + interval '3 days', now() + interval '3 days' + interval '1 hour', 'SCHEDULED', 'https://zoom.us/j/123456789', now(), now()),
('session2-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 'module2-123', 'CSS Advanced Techniques', 'Learn advanced CSS techniques for responsive design', now() + interval '7 days', now() + interval '7 days' + interval '90 minutes', 'SCHEDULED', 'https://zoom.us/j/987654321', now(), now());

-- Insert notifications
INSERT INTO "Notification" (id, "userId", "courseId", type, title, message, "read", "readAt", "relatedEntityId", "relatedEntityType", "actionUrl", "createdAt", "updatedAt") VALUES
('notif1-123', 'student1-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 'ENROLLMENT_CONFIRMED', 'Course Enrollment Confirmed', 'You have been enrolled in Introduction to Web Development', false, NULL, NULL, NULL, '/courses/b4c64f3f-84c3-4412-96fb-79d49dd70243', now(), now()),
('notif2-123', 'student1-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 'ASSIGNMENT_CREATED', 'New Assignment: Build a Simple HTML Page', 'A new assignment has been created in your course', false, NULL, 'assignment1-123', 'Assignment', '/courses/b4c64f3f-84c3-4412-96fb-79d49dd70243/assignments/assignment1-123', now(), now()),
('notif3-123', 'student2-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 'ASSIGNMENT_GRADED', 'Assignment Graded', 'Your assignment has been graded. Check the feedback!', true, now(), 'submission2-123', 'AssignmentSubmission', '/courses/b4c64f3f-84c3-4412-96fb-79d49dd70243/assignments/assignment1-123/submissions/submission2-123', now(), now()),
('notif4-123', 'student1-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 'LIVE_SESSION_SCHEDULED', 'New Live Session Scheduled', 'HTML Basics Live Q&A is scheduled', false, NULL, 'session1-123', 'LiveSession', '/courses/b4c64f3f-84c3-4412-96fb-79d49dd70243/live-sessions/session1-123', now(), now()),
('notif5-123', 'student2-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', 'ANNOUNCEMENT_PUBLISHED', 'New Announcement', 'Assignment 1 Grading Complete', false, NULL, NULL, NULL, '/courses/b4c64f3f-84c3-4412-96fb-79d49dd70243', now(), now());

-- Insert messages
INSERT INTO "Message" (id, content, "senderId", "courseId", "timestamp") VALUES
('message1-123', 'Welcome to the course discussion! Please introduce yourself.', 'instructor-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', now() - interval '5 days'),
('message2-123', 'Hi everyone! I''m excited to learn web development.', 'student1-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', now() - interval '4 days'),
('message3-123', 'Great! Looking forward to working with everyone.', 'student2-123', 'b4c64f3f-84c3-4412-96fb-79d49dd70243', now() - interval '4 days');
