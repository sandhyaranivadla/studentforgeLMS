import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockCourse = {
    id: 'course-1',
    title: 'Test Course',
    instructorId: 'instructor-1',
    description: 'Test Description',
    price: 0,
    published: true,
    thumbnail: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEnrollment = {
    id: 'enrollment-1',
    studentId: 'student-1',
    courseId: 'course-1',
    progress: 50,
    status: 'ACTIVE',
    createdAt: new Date(),
  };

  const mockPrisma = {
    course: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    lessonProgress: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    courseModule: {
      findMany: jest.fn(),
    },
    assignment: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    quiz: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    quizAttempt: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    assignmentSubmission: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    liveSession: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    lesson: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCourseOverview', () => {
    it('should return course overview for course owner', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.enrollment.findMany.mockResolvedValue([mockEnrollment]);
      mockPrisma.assignment.findMany.mockResolvedValue([]);
      mockPrisma.quiz.findMany.mockResolvedValue([]);
      mockPrisma.lesson.count.mockResolvedValue(5);
      mockPrisma.lessonProgress.findMany.mockResolvedValue([]);
      mockPrisma.liveSession.findMany.mockResolvedValue([]);

      const result = await service.getCourseOverview(
        'course-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result).toBeDefined();
      expect(result.enrollmentCount).toBe(1);
      expect(result.lessonsTotal).toBe(5);
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'course-1' },
      });
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);

      await expect(
        service.getCourseOverview(
          'course-1',
          'other-instructor',
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to access any course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.enrollment.findMany.mockResolvedValue([]);
      mockPrisma.assignment.findMany.mockResolvedValue([]);
      mockPrisma.quiz.findMany.mockResolvedValue([]);
      mockPrisma.lesson.count.mockResolvedValue(0);
      mockPrisma.lessonProgress.findMany.mockResolvedValue([]);
      mockPrisma.liveSession.findMany.mockResolvedValue([]);

      const result = await service.getCourseOverview(
        'course-1',
        'any-admin',
        Role.ADMIN,
      );

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for non-existent course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(
        service.getCourseOverview('non-existent', 'instructor-1', Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEnrolledStudents', () => {
    it('should return list of enrolled students', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.enrollment.findMany.mockResolvedValue([
        {
          ...mockEnrollment,
          student: {
            name: 'Test Student',
            email: 'student@test.com',
          },
        },
      ]);
      mockPrisma.lesson.count.mockResolvedValue(5);
      mockPrisma.lessonProgress.count.mockResolvedValue(3);
      mockPrisma.assignment.count.mockResolvedValue(2);
      mockPrisma.assignmentSubmission.count.mockResolvedValue(1);
      mockPrisma.assignmentSubmission.findMany.mockResolvedValue([]);
      mockPrisma.assignment.aggregate.mockResolvedValue({
        _avg: { maxMarks: 10 },
      });
      mockPrisma.quiz.count.mockResolvedValue(1);
      mockPrisma.quizAttempt.findMany.mockResolvedValue([]);
      mockPrisma.liveSession.count.mockResolvedValue(2);
      mockPrisma.lessonProgress.findFirst.mockResolvedValue(null);
      mockPrisma.assignmentSubmission.findFirst.mockResolvedValue(null);
      mockPrisma.quizAttempt.findFirst.mockResolvedValue(null);

      const result = await service.getEnrolledStudents(
        'course-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].studentName).toBe('Test Student');
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);

      await expect(
        service.getEnrolledStudents(
          'course-1',
          'other-instructor',
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getStudentDashboard', () => {
    it('should return individual student dashboard', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.enrollment.findFirst.mockResolvedValue({
        ...mockEnrollment,
        student: {
          name: 'Test Student',
          email: 'student@test.com',
        },
      });
      mockPrisma.lesson.count.mockResolvedValue(5);
      mockPrisma.lessonProgress.count.mockResolvedValue(3);
      mockPrisma.assignment.count.mockResolvedValue(2);
      mockPrisma.assignmentSubmission.count.mockResolvedValue(1);
      mockPrisma.assignmentSubmission.findMany.mockResolvedValue([]);
      mockPrisma.assignment.aggregate.mockResolvedValue({
        _avg: { maxMarks: 10 },
      });
      mockPrisma.quiz.count.mockResolvedValue(1);
      mockPrisma.quizAttempt.findMany.mockResolvedValue([]);
      mockPrisma.liveSession.count.mockResolvedValue(2);
      mockPrisma.lessonProgress.findFirst.mockResolvedValue(null);
      mockPrisma.assignmentSubmission.findFirst.mockResolvedValue(null);
      mockPrisma.quizAttempt.findFirst.mockResolvedValue(null);

      const result = await service.getStudentDashboard(
        'course-1',
        'student-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result).toBeDefined();
      expect(result.studentId).toBe('student-1');
      expect(result.lessonsCompleted).toBe(3);
    });

    it('should throw NotFoundException for non-enrolled student', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.getStudentDashboard(
          'course-1',
          'non-enrolled-student',
          'instructor-1',
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAssignmentStats', () => {
    it('should return assignment statistics', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.enrollment.count.mockResolvedValue(10);
      mockPrisma.assignment.findMany.mockResolvedValue([
        {
          id: 'assignment-1',
          title: 'Assignment 1',
          description: 'Test Assignment',
          dueDate: new Date(),
          maxMarks: 100,
          courseId: 'course-1',
          moduleId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          submissions: [
            {
              id: 'sub-1',
              assignmentId: 'assignment-1',
              studentId: 'student-1',
              submissionText: 'Test',
              marks: 80,
              feedback: null,
              submittedAt: new Date(),
              gradedAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          module: null,
        },
      ]);

      const result = await service.getAssignmentStats(
        'course-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].title).toBe('Assignment 1');
      expect(result[0].submittedCount).toBe(1);
    });
  });

  describe('getQuizStats', () => {
    it('should return quiz statistics', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.enrollment.count.mockResolvedValue(10);
      mockPrisma.quiz.findMany.mockResolvedValue([
        {
          id: 'quiz-1',
          title: 'Quiz 1',
          description: 'Test Quiz',
          courseId: 'course-1',
          moduleId: null,
          published: true,
          timeLimit: 3600,
          passingScore: 70,
          showCorrectAnswers: true,
          randomizeQuestions: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          questions: [
            {
              id: 'q1',
              quizId: 'quiz-1',
              questionText: 'Test Question',
              marks: 10,
              orderIndex: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              options: [],
            },
          ],
          attempts: [
            {
              id: 'attempt-1',
              quizId: 'quiz-1',
              studentId: 'student-1',
              startedAt: new Date(),
              submittedAt: new Date(),
              score: 80,
              totalMarks: 100,
              passing: true,
              createdAt: new Date(),
            },
          ],
          module: null,
        },
      ]);

      const result = await service.getQuizStats(
        'course-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].title).toBe('Quiz 1');
      expect(result[0].attemptCount).toBe(1);
      expect(result[0].passRate).toBe(100);
    });
  });

  describe('getLessonStats', () => {
    it('should return lesson statistics', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.enrollment.count.mockResolvedValue(10);
      mockPrisma.courseModule.findMany.mockResolvedValue([
        {
          id: 'module-1',
          title: 'Module 1',
          courseId: 'course-1',
          orderIndex: 1,
          lessons: [
            {
              id: 'lesson-1',
              title: 'Lesson 1',
              type: 'VIDEO',
              duration: '10:00',
              moduleId: 'module-1',
              orderIndex: 1,
              contentUrl: 'https://example.com/video.mp4',
            },
          ],
        },
      ]);
      mockPrisma.lessonProgress.findMany.mockResolvedValue([
        {
          id: 'lp-1',
          studentId: 'student-1',
          lessonId: 'lesson-1',
          courseId: 'course-1',
          completed: true,
          completedAt: new Date(),
          lastAccessedAt: new Date(),
        },
      ]);

      const result = await service.getLessonStats(
        'course-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].title).toBe('Lesson 1');
      expect(result[0].uniqueStudentsCompleted).toBe(1);
    });
  });

  describe('getLiveSessionStats', () => {
    it('should return live session statistics', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.enrollment.count.mockResolvedValue(10);
      mockPrisma.liveSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          courseId: 'course-1',
          moduleId: null,
          title: 'Live Class 1',
          description: 'Test Session',
          startTime: new Date(),
          endTime: null,
          status: 'SCHEDULED',
          zoomMeetingId: 'zoom-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          module: null,
        },
      ]);

      const result = await service.getLiveSessionStats(
        'course-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].title).toBe('Live Class 1');
      expect(result[0].status).toBe('SCHEDULED');
    });
  });
});
