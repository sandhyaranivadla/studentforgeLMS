import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationType, Role } from '@prisma/client';

describe('Notifications E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let instructor: any;
  let student: any;
  let course: any;
  let assignment: any;
  let instructorToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Create test users
    instructor = await prisma.user.create({
      data: {
        email: 'instructor@test.com',
        password: 'hashed_password',
        name: 'Test Instructor',
        role: Role.INSTRUCTOR,
      },
    });

    student = await prisma.user.create({
      data: {
        email: 'student@test.com',
        password: 'hashed_password',
        name: 'Test Student',
        role: Role.STUDENT,
      },
    });

    // Create JWT tokens
    instructorToken = jwtService.sign(
      { sub: instructor.id, email: instructor.email, role: instructor.role },
      { secret: process.env.JWT_SECRET },
    );

    studentToken = jwtService.sign(
      { sub: student.id, email: student.email, role: student.role },
      { secret: process.env.JWT_SECRET },
    );

    // Create course
    course = await prisma.course.create({
      data: {
        title: 'Test Course',
        description: 'Test Description',
        instructorId: instructor.id,
        published: true,
      },
    });

    // Enroll student
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId: course.id,
      },
    });

    // Create assignment
    assignment = await prisma.assignment.create({
      data: {
        courseId: course.id,
        title: 'Test Assignment',
        description: 'Test Assignment Description',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.notification.deleteMany({});
    await prisma.assignmentSubmission.deleteMany({});
    await prisma.assignment.deleteMany({});
    await prisma.enrollment.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.user.deleteMany({});

    await app.close();
  });

  describe('Notification Flow: Assignment Submission', () => {
    it('should create notification when student submits assignment', async () => {
      const submissionRes = await request(app.getHttpServer())
        .post(`/assignments/${assignment.id}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          submissionText: 'My submission text',
        });

      expect(submissionRes.status).toBe(201);

      // Verify notification was created in database
      const notification = await prisma.notification.findFirst({
        where: {
          type: NotificationType.ASSIGNMENT_SUBMITTED,
          userId: instructor.id,
        },
      });

      expect(notification).toBeDefined();
      expect(notification?.title).toContain('submission');
      expect(notification?.message).toContain(student.name);
      expect(notification?.read).toBe(false);
    });

    it('should allow instructor to fetch notifications via API', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications?limit=20')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBeGreaterThan(0);

      const submissionNotif = res.body.data.find(
        (n: any) => n.type === NotificationType.ASSIGNMENT_SUBMITTED,
      );
      expect(submissionNotif).toBeDefined();
    });

    it('should enforce user isolation - student cannot see instructor notifications', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications?limit=20')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);

      const submissionNotif = res.body.data.find(
        (n: any) => n.type === NotificationType.ASSIGNMENT_SUBMITTED,
      );
      expect(submissionNotif).toBeUndefined();
    });
  });

  describe('Notification Flow: Assignment Grading', () => {
    let submission: any;

    beforeAll(async () => {
      // Create and get submission
      const submissionRes = await request(app.getHttpServer())
        .post(`/assignments/${assignment.id}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          submissionText: 'Submission for grading',
        });

      submission = submissionRes.body;
    });

    it('should create notification when instructor grades submission', async () => {
      const gradeRes = await request(app.getHttpServer())
        .patch(`/assignments/submissions/${submission.id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          marks: 85,
          feedback: 'Good work!',
        });

      expect(gradeRes.status).toBe(200);

      // Verify notification was created for student
      const notification = await prisma.notification.findFirst({
        where: {
          type: NotificationType.ASSIGNMENT_GRADED,
          userId: student.id,
        },
      });

      expect(notification).toBeDefined();
      expect(notification?.message).toContain('85');
      expect(notification?.read).toBe(false);
    });

    it('student should receive graded notification', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications?limit=20')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);

      const gradedNotif = res.body.data.find(
        (n: any) => n.type === NotificationType.ASSIGNMENT_GRADED,
      );
      expect(gradedNotif).toBeDefined();
      expect(gradedNotif.read).toBe(false);
    });
  });

  describe('Notification Flow: Announcement Publishing', () => {
    let announcement: any;

    beforeAll(async () => {
      announcement = await prisma.announcement.create({
        data: {
          courseId: course.id,
          instructorId: instructor.id,
          title: 'Test Announcement',
          content: 'Test announcement content',
          status: 'DRAFT',
        },
      });
    });

    it('should create notifications for all enrolled students when announcement published', async () => {
      const updateRes = await request(app.getHttpServer())
        .patch(`/announcements/${announcement.id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          status: 'PUBLISHED',
        });

      expect(updateRes.status).toBe(200);

      // Verify notification was created for all enrolled students
      const notification = await prisma.notification.findFirst({
        where: {
          type: NotificationType.ANNOUNCEMENT_PUBLISHED,
          userId: student.id,
        },
      });

      expect(notification).toBeDefined();
      expect(notification?.title).toContain('announcement');
    });

    it('student should receive announcement notification', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications?limit=20')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);

      const announcementNotif = res.body.data.find(
        (n: any) => n.type === NotificationType.ANNOUNCEMENT_PUBLISHED,
      );
      expect(announcementNotif).toBeDefined();
    });
  });

  describe('Notification Management', () => {
    let testNotification: any;

    beforeAll(async () => {
      testNotification = await prisma.notification.create({
        data: {
          userId: instructor.id,
          courseId: course.id,
          type: NotificationType.ANNOUNCEMENT_PUBLISHED,
          title: 'Test for Management',
          message: 'Test notification',
        },
      });
    });

    it('should mark notification as read', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/notifications/${testNotification.id}/read`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.read).toBe(true);
      expect(res.body.readAt).toBeDefined();
    });

    it('should return correct unread count', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications/unread-count')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.unreadCount).toBeGreaterThanOrEqual(0);
      expect(typeof res.body.unreadCount).toBe('number');
    });

    it('should delete notification', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/notifications/${testNotification.id}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);

      // Verify deletion
      const deleted = await prisma.notification.findUnique({
        where: { id: testNotification.id },
      });
      expect(deleted).toBeNull();
    });

    it('should mark all as read', async () => {
      const res = await request(app.getHttpServer())
        .patch('/notifications/read-all')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.updated).toBeGreaterThanOrEqual(0);

      // Verify all are marked read
      const unread = await prisma.notification.count({
        where: {
          userId: instructor.id,
          read: false,
        },
      });
      expect(unread).toBe(0);
    });
  });

  describe('Notification Security', () => {
    it('should reject unauthorized access', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('should not allow users to see other users notifications', async () => {
      // Create notification for instructor
      const notif = await prisma.notification.create({
        data: {
          userId: instructor.id,
          courseId: course.id,
          type: NotificationType.ANNOUNCEMENT_PUBLISHED,
          title: 'Private Notification',
          message: 'Only for instructor',
        },
      });

      // Try to access as student
      const res = await request(app.getHttpServer())
        .delete(`/notifications/${notif.id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);

      // Verify notification still exists
      const exists = await prisma.notification.findUnique({
        where: { id: notif.id },
      });
      expect(exists).toBeDefined();
    });
  });
});
