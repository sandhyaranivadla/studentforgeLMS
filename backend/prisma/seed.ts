import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Client } from 'pg';

console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

let prisma: PrismaClient;

async function main() {
  // Initialize Prisma with CockroachDB adapter
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  const adapter = new PrismaPg(client);
  prisma = new PrismaClient({ adapter });

  console.log('Starting seed...');

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@studentforge.com',
      passwordHash: '$2b$10$hashed_admin_password',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const instructorUser = await prisma.user.create({
    data: {
      email: 'instructor@studentforge.com',
      passwordHash: '$2b$10$hashed_instructor_password',
      name: 'John Instructor',
      role: 'INSTRUCTOR',
    },
  });

  const studentUser1 = await prisma.user.create({
    data: {
      email: 'student1@studentforge.com',
      passwordHash: '$2b$10$hashed_student1_password',
      name: 'Alice Student',
      role: 'STUDENT',
    },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      email: 'student2@studentforge.com',
      passwordHash: '$2b$10$hashed_student2_password',
      name: 'Bob Student',
      role: 'STUDENT',
    },
  });

  console.log('✅ Users created');

  // Create a course
  const course = await prisma.course.create({
    data: {
      title: 'Introduction to Web Development',
      description: 'Learn the basics of web development with HTML, CSS, and JavaScript',
      price: 49.99,
      instructorId: instructorUser.id,
      published: true,
      thumbnail: 'https://example.com/course-thumbnail.jpg',
    },
  });

  console.log('✅ Course created');

  // Create course modules
  const module1 = await prisma.courseModule.create({
    data: {
      title: 'Module 1: HTML Fundamentals',
      courseId: course.id,
      orderIndex: 1,
    },
  });

  const module2 = await prisma.courseModule.create({
    data: {
      title: 'Module 2: CSS Styling',
      courseId: course.id,
      orderIndex: 2,
    },
  });

  const module3 = await prisma.courseModule.create({
    data: {
      title: 'Module 3: JavaScript Basics',
      courseId: course.id,
      orderIndex: 3,
    },
  });

  console.log('✅ Modules created');

  // Create lessons
  const lesson1 = await prisma.lesson.create({
    data: {
      title: 'HTML Basics',
      type: 'VIDEO',
      duration: '30 minutes',
      moduleId: module1.id,
      orderIndex: 1,
      contentUrl: 'https://example.com/html-basics.mp4',
    },
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      title: 'HTML Forms',
      type: 'PDF',
      duration: '20 minutes',
      moduleId: module1.id,
      orderIndex: 2,
      contentUrl: 'https://example.com/html-forms.pdf',
    },
  });

  const lesson3 = await prisma.lesson.create({
    data: {
      title: 'CSS Selectors',
      type: 'VIDEO',
      duration: '45 minutes',
      moduleId: module2.id,
      orderIndex: 1,
      contentUrl: 'https://example.com/css-selectors.mp4',
    },
  });

  const lesson4 = await prisma.lesson.create({
    data: {
      title: 'Responsive Design',
      type: 'VIDEO',
      duration: '50 minutes',
      moduleId: module2.id,
      orderIndex: 2,
      contentUrl: 'https://example.com/responsive-design.mp4',
    },
  });

  console.log('✅ Lessons created');

  // Create assignments for instructor
  const assignment1 = await prisma.assignment.create({
    data: {
      courseId: course.id,
      moduleId: module1.id,
      title: 'Build a Simple HTML Page',
      description: 'Create a simple HTML page with proper structure',
      instructions: 'Create an HTML page with header, nav, main, and footer. Include at least 5 semantic HTML elements.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxMarks: 100,
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      courseId: course.id,
      moduleId: module2.id,
      title: 'CSS Styling Challenge',
      description: 'Style a website using advanced CSS techniques',
      instructions: 'Apply CSS grid, flexbox, and media queries to make a responsive layout.',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxMarks: 150,
    },
  });

  const assignment3 = await prisma.assignment.create({
    data: {
      courseId: course.id,
      moduleId: module3.id,
      title: 'JavaScript Calculator',
      description: 'Build a working calculator using JavaScript',
      instructions: 'Create a functional calculator that can perform basic arithmetic operations.',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      maxMarks: 200,
    },
  });

  console.log('✅ Assignments created for instructor');

  // Create student submissions
  const submission1 = await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: studentUser1.id,
      submissionText: 'My HTML page: https://example.com/alice-html',
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      marks: 90,
      feedback: 'Great work! Good use of semantic HTML. Work on spacing next time.',
      gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const submission2 = await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: studentUser2.id,
      submissionText: 'My HTML page: https://example.com/bob-html',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      marks: 75,
      feedback: 'Good structure, but missing some semantic elements.',
      gradedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const submission3 = await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment2.id,
      studentId: studentUser1.id,
      submissionText: 'My CSS styled website: https://example.com/alice-css',
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Assignment submissions created');

  // Create quizzes
  const quiz1 = await prisma.quiz.create({
    data: {
      courseId: course.id,
      moduleId: module1.id,
      title: 'HTML Fundamentals Quiz',
      description: 'Test your knowledge of HTML basics',
      published: true,
      timeLimit: 30,
      passingScore: 60,
      showCorrectAnswers: true,
      randomizeQuestions: false,
    },
  });

  const quiz2 = await prisma.quiz.create({
    data: {
      courseId: course.id,
      moduleId: module2.id,
      title: 'CSS Styling Quiz',
      description: 'Test your CSS knowledge',
      published: true,
      timeLimit: 45,
      passingScore: 70,
      showCorrectAnswers: true,
      randomizeQuestions: true,
    },
  });

  console.log('✅ Quizzes created');

  // Create quiz questions for HTML quiz
  const q1 = await prisma.quizQuestion.create({
    data: {
      quizId: quiz1.id,
      questionText: 'What does HTML stand for?',
      marks: 1,
      orderIndex: 1,
    },
  });

  const q2 = await prisma.quizQuestion.create({
    data: {
      quizId: quiz1.id,
      questionText: 'Which tag is used for the largest heading?',
      marks: 1,
      orderIndex: 2,
    },
  });

  // Create options for HTML quiz Q1
  const opt1_1 = await prisma.quizOption.create({
    data: {
      questionId: q1.id,
      optionText: 'Hyper Text Markup Language',
      isCorrect: true,
      orderIndex: 1,
    },
  });

  await prisma.quizOption.create({
    data: {
      questionId: q1.id,
      optionText: 'High Tech Modern Language',
      isCorrect: false,
      orderIndex: 2,
    },
  });

  // Create options for HTML quiz Q2
  const opt2_1 = await prisma.quizOption.create({
    data: {
      questionId: q2.id,
      optionText: '<h1>',
      isCorrect: true,
      orderIndex: 1,
    },
  });

  await prisma.quizOption.create({
    data: {
      questionId: q2.id,
      optionText: '<h6>',
      isCorrect: false,
      orderIndex: 2,
    },
  });

  console.log('✅ Quiz questions and options created');

  // Create quiz attempts (student performance)
  const attempt1 = await prisma.quizAttempt.create({
    data: {
      quizId: quiz1.id,
      studentId: studentUser1.id,
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      score: 2,
      totalMarks: 2,
      passing: true,
    },
  });

  const attempt2 = await prisma.quizAttempt.create({
    data: {
      quizId: quiz1.id,
      studentId: studentUser2.id,
      submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      score: 1,
      totalMarks: 2,
      passing: false,
    },
  });

  // Create student quiz answers
  await prisma.studentQuizAnswer.create({
    data: {
      attemptId: attempt1.id,
      questionId: q1.id,
      selectedOptionId: opt1_1.id,
      marksObtained: 1,
    },
  });

  await prisma.studentQuizAnswer.create({
    data: {
      attemptId: attempt1.id,
      questionId: q2.id,
      selectedOptionId: opt2_1.id,
      marksObtained: 1,
    },
  });

  console.log('✅ Quiz attempts and answers created');

  // Create enrollments
  const enrollment1 = await prisma.enrollment.create({
    data: {
      studentId: studentUser1.id,
      courseId: course.id,
      progress: 60,
      status: 'ACTIVE',
    },
  });

  const enrollment2 = await prisma.enrollment.create({
    data: {
      studentId: studentUser2.id,
      courseId: course.id,
      progress: 40,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Enrollments created');

  // Create lesson progress
  await prisma.lessonProgress.create({
    data: {
      studentId: studentUser1.id,
      lessonId: lesson1.id,
      courseId: course.id,
      completed: true,
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.lessonProgress.create({
    data: {
      studentId: studentUser1.id,
      lessonId: lesson2.id,
      courseId: course.id,
      completed: true,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.lessonProgress.create({
    data: {
      studentId: studentUser2.id,
      lessonId: lesson1.id,
      courseId: course.id,
      completed: true,
      completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Lesson progress created');

  // Create announcements
  await prisma.announcement.create({
    data: {
      courseId: course.id,
      instructorId: instructorUser.id,
      title: 'Welcome to Web Development!',
      content: 'Welcome to the Introduction to Web Development course. This course will cover HTML, CSS, and JavaScript fundamentals. Let\'s build amazing websites together!',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.announcement.create({
    data: {
      courseId: course.id,
      instructorId: instructorUser.id,
      title: 'Assignment 1 Grading Complete',
      content: 'Great work everyone! I\'ve graded the first assignment. Check your submissions for feedback.',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Announcements created');

  // Create live sessions
  const liveSession1 = await prisma.liveSession.create({
    data: {
      courseId: course.id,
      moduleId: module1.id,
      title: 'HTML Basics Live Q&A',
      description: 'Join us for a live session to discuss HTML basics and answer your questions',
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      status: 'SCHEDULED',
      zoomMeetingId: 'https://zoom.us/j/123456789',
    },
  });

  const liveSession2 = await prisma.liveSession.create({
    data: {
      courseId: course.id,
      moduleId: module2.id,
      title: 'CSS Advanced Techniques',
      description: 'Learn advanced CSS techniques for responsive design',
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
      status: 'SCHEDULED',
      zoomMeetingId: 'https://zoom.us/j/987654321',
    },
  });

  console.log('✅ Live sessions created');

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: studentUser1.id,
      courseId: course.id,
      type: 'ENROLLMENT_CONFIRMED',
      title: 'Course Enrollment Confirmed',
      message: 'You have been enrolled in Introduction to Web Development',
      actionUrl: `/courses/${course.id}`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: studentUser1.id,
      courseId: course.id,
      type: 'ASSIGNMENT_CREATED',
      title: 'New Assignment: Build a Simple HTML Page',
      message: 'A new assignment has been created in your course',
      relatedEntityId: assignment1.id,
      relatedEntityType: 'Assignment',
      actionUrl: `/courses/${course.id}/assignments/${assignment1.id}`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: studentUser2.id,
      courseId: course.id,
      type: 'ASSIGNMENT_GRADED',
      title: 'Assignment Graded',
      message: 'Your assignment has been graded. Check the feedback!',
      read: true,
      readAt: new Date(),
      relatedEntityId: submission2.id,
      relatedEntityType: 'AssignmentSubmission',
      actionUrl: `/courses/${course.id}/assignments/${assignment1.id}/submissions/${submission2.id}`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: studentUser1.id,
      courseId: course.id,
      type: 'LIVE_SESSION_SCHEDULED',
      title: 'New Live Session Scheduled',
      message: 'HTML Basics Live Q&A is scheduled for ' + liveSession1.startTime.toDateString(),
      relatedEntityId: liveSession1.id,
      relatedEntityType: 'LiveSession',
      actionUrl: `/courses/${course.id}/live-sessions/${liveSession1.id}`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: studentUser2.id,
      courseId: course.id,
      type: 'ANNOUNCEMENT_PUBLISHED',
      title: 'New Announcement',
      message: 'Assignment 1 Grading Complete',
      actionUrl: `/courses/${course.id}`,
    },
  });

  console.log('✅ Notifications created');

  // Create messages
  await prisma.message.create({
    data: {
      content: 'Welcome to the course discussion! Please introduce yourself.',
      senderId: instructorUser.id,
      courseId: course.id,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.message.create({
    data: {
      content: 'Hi everyone! I\'m excited to learn web development.',
      senderId: studentUser1.id,
      courseId: course.id,
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.message.create({
    data: {
      content: 'Great! Looking forward to working with everyone.',
      senderId: studentUser2.id,
      courseId: course.id,
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Messages created');

  console.log('\n🎉 SEED COMPLETED SUCCESSFULLY! 🎉');
  console.log('\n📊 Summary:');
  console.log('- 1 Admin User');
  console.log('- 1 Instructor User');
  console.log('- 2 Student Users');
  console.log('- 1 Course with 3 Modules');
  console.log('- 4 Lessons');
  console.log('- 3 Assignments with 3 Submissions');
  console.log('- 2 Quizzes with Questions and Attempts');
  console.log('- 2 Enrollments');
  console.log('- 3 Lesson Progress Records');
  console.log('- 2 Announcements');
  console.log('- 2 Live Sessions');
  console.log('- 5 Notifications');
  console.log('- 3 Messages');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
