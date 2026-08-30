import { PrismaClient } from '@prisma/client';

async function runDiagnostics() {
  const prisma = new PrismaClient();

  try {
    console.log('\n=== DIAGNOSTIC REPORT ===\n');

    // 1. List all users
    console.log('1. ALL USERS:');
    const users = await prisma.user.findMany();
    users.forEach((u) => {
      console.log(
        `   - ${u.email} (${u.role}): id=${u.id.substring(0, 8)}...`,
      );
    });

    // 2. List all courses
    console.log('\n2. ALL COURSES:');
    const courses = await prisma.course.findMany({
      include: { instructor: true },
    });
    courses.forEach((c) => {
      console.log(
        `   - "${c.title}" (id=${c.id.substring(0, 8)}...) → Instructor: ${c.instructor.email}`,
      );
    });

    // 3. Course details with content counts
    console.log('\n3. COURSE CONTENT SUMMARY:');
    for (const course of courses) {
      const assignments = await prisma.assignment.count({
        where: { courseId: course.id },
      });
      const quizzes = await prisma.quiz.count({
        where: { courseId: course.id },
      });
      const liveSessions = await prisma.liveSession.count({
        where: { courseId: course.id },
      });
      const announcements = await prisma.announcement.count({
        where: { courseId: course.id },
      });
      const enrollments = await prisma.enrollment.count({
        where: { courseId: course.id },
      });

      console.log(`\n   Course: "${course.title}"`);
      console.log(`   ID: ${course.id}`);
      console.log(`   Instructor: ${course.instructor.email}`);
      console.log(`   Instructor ID: ${course.instructorId}`);
      console.log(`   - Assignments: ${assignments}`);
      console.log(`   - Quizzes: ${quizzes}`);
      console.log(`   - Live Sessions: ${liveSessions}`);
      console.log(`   - Announcements: ${announcements}`);
      console.log(`   - Enrollments: ${enrollments}`);
    }

    // 4. Check the specific courseId from the failing request
    const testCourseId = 'b4c64f3f-84c3-4412-96fb-79d49dd70243';
    console.log(`\n4. CHECKING SPECIFIC COURSE: ${testCourseId}`);
    const specificCourse = await prisma.course.findUnique({
      where: { id: testCourseId },
      include: { instructor: true },
    });

    if (specificCourse) {
      console.log(`   Found: "${specificCourse.title}"`);
      console.log(`   Instructor: ${specificCourse.instructor.email}`);
      console.log(`   Instructor ID: ${specificCourse.instructorId}`);
    } else {
      console.log(`   NOT FOUND in database`);
    }

    console.log('\n=== END DIAGNOSTIC ===\n');
  } catch (error) {
    console.error('Diagnostic error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runDiagnostics();
