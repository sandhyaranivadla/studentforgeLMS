import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Client } from 'pg';

async function diagnose() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Connecting to:', connectionString?.substring(0, 80) + '...');

  const client = new Client({ connectionString });
  await client.connect();

  const adapter = new PrismaPg(client);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('\n=== DATABASE DIAGNOSTIC ===\n');

    // Get the specific course
    const course = await prisma.course.findUnique({
      where: { id: 'b4c64f3f-84c3-4412-96fb-79d49dd70243' },
      include: { instructor: true },
    });

    if (!course) {
      console.log('❌ Course NOT FOUND: b4c64f3f-84c3-4412-96fb-79d49dd70243');
    } else {
      console.log('✅ Course FOUND:');
      console.log(`   ID: ${course.id}`);
      console.log(`   Title: ${course.title}`);
      console.log(`   Instructor ID: ${course.instructorId}`);
      console.log(`   Instructor Email: ${course.instructor?.email}`);
    }

    // Get the seeded instructor
    const seedInstructor = await prisma.user.findUnique({
      where: { id: 'instructor-123' },
    });

    console.log('\n📝 Seeded Instructor (instructor-123):');
    if (seedInstructor) {
      console.log(`   ✅ FOUND - Email: ${seedInstructor.email}`);
    } else {
      console.log('   ❌ NOT FOUND in database');
    }

    // Check assignments exist
    const assignmentCount = await prisma.assignment.count({
      where: { courseId: 'b4c64f3f-84c3-4412-96fb-79d49dd70243' },
    });
    console.log(`\n📚 Assignments: ${assignmentCount}`);

    const quizCount = await prisma.quiz.count({
      where: { courseId: 'b4c64f3f-84c3-4412-96fb-79d49dd70243' },
    });
    console.log(`📚 Quizzes: ${quizCount}`);

    const liveSessionCount = await prisma.liveSession.count({
      where: { courseId: 'b4c64f3f-84c3-4412-96fb-79d49dd70243' },
    });
    console.log(`📚 Live Sessions: ${liveSessionCount}`);

    const announcementCount = await prisma.announcement.count({
      where: { courseId: 'b4c64f3f-84c3-4412-96fb-79d49dd70243' },
    });
    console.log(`📚 Announcements: ${announcementCount}`);

    // List ALL users to see who was logged in
    console.log('\n👥 ALL USERS IN DATABASE:');
    const allUsers = await prisma.user.findMany();
    allUsers.forEach((u) => {
      console.log(`   - ${u.email} (${u.role}) ID: ${u.id}`);
    });

    // List all courses
    console.log('\n🏫 ALL COURSES IN DATABASE:');
    const allCourses = await prisma.course.findMany({
      include: { instructor: true },
    });
    allCourses.forEach((c) => {
      console.log(`   - "${c.title}" owned by ${c.instructor?.email} (${c.instructorId})`);
    });

    console.log('\n=== MISMATCH ANALYSIS ===');
    const authenticatedUserId = 'd65197cb-b9c3-4615-97a8-5b0193bd9ff4';
    const courseInstructorId = course?.instructorId;

    console.log(`\nAuthenticating instructor ID (from frontend log): ${authenticatedUserId}`);
    console.log(`Course instructor ID (from database): ${courseInstructorId}`);
    console.log(`Match: ${authenticatedUserId === courseInstructorId ? '✅ YES' : '❌ NO'}`);

    // Find who this authenticated user is
    const authUser = await prisma.user.findUnique({
      where: { id: authenticatedUserId },
    });

    if (authUser) {
      console.log(`\nAuthenticated user is: ${authUser.email} (${authUser.role})`);
      console.log(`Course owner is: ${course?.instructor?.email}`);
    } else {
      console.log(`\n❌ Authenticated user NOT FOUND in database!`);
    }
  } finally {
    await prisma.$disconnect();
    await client.end();
  }
}

diagnose().catch(console.error);
