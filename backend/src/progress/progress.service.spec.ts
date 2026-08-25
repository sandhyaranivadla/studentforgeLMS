import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

/* ── Mock Prisma ──────────────────────────────────────────── */
const mockPrismaService = {
  enrollment: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  lesson: {
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  lessonProgress: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
};

/* ── Fixtures ─────────────────────────────────────────────── */
const STUDENT_ID = 'student-1';
const OTHER_STUDENT_ID = 'student-2';
const COURSE_ID = 'course-1';
const OTHER_COURSE_ID = 'course-2';
const LESSON_ID = 'lesson-1';
const LESSON_ID_2 = 'lesson-2';
const MODULE_ID = 'module-1';
const ENROLLMENT_ID = 'enrollment-1';

const mockEnrollment = {
  id: ENROLLMENT_ID,
  studentId: STUDENT_ID,
  courseId: COURSE_ID,
  progress: 0,
  status: 'ACTIVE',
  createdAt: new Date(),
};

const mockLesson = {
  id: LESSON_ID,
  title: 'Lesson 1',
  type: 'VIDEO',
  contentUrl: null,
  duration: null,
  moduleId: MODULE_ID,
  orderIndex: 1,
  module: {
    id: MODULE_ID,
    title: 'Module 1',
    courseId: COURSE_ID,
    orderIndex: 1,
  },
};

const mockLessonOtherCourse = {
  ...mockLesson,
  module: {
    ...mockLesson.module,
    courseId: OTHER_COURSE_ID,
  },
};

const mockLessonProgress = {
  id: 'progress-1',
  studentId: STUDENT_ID,
  lessonId: LESSON_ID,
  courseId: COURSE_ID,
  completed: false,
  completedAt: null,
  lastAccessedAt: new Date(),
};

const mockCompletedLessonProgress = {
  ...mockLessonProgress,
  completed: true,
  completedAt: new Date(),
};

/* ── Test Suite ───────────────────────────────────────────── */
describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ── completeLesson ───────────────────────────────────────── */
  describe('completeLesson', () => {
    it('should throw ForbiddenException if student not enrolled', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);
      await expect(
        service.completeLesson(STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.completeLesson(STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow(
        'You must be enrolled in this course to track progress.',
      );
    });

    it('should throw NotFoundException if lesson does not exist', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(null);
      await expect(
        service.completeLesson(STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.completeLesson(STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow('Lesson not found.');
    });

    it('should throw BadRequestException if lesson belongs to different course', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(
        mockLessonOtherCourse,
      );
      await expect(
        service.completeLesson(STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.completeLesson(STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow('This lesson does not belong to the specified course.');
    });

    it('should throw ConflictException if lesson already completed', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.lessonProgress.findUnique.mockResolvedValue(
        mockCompletedLessonProgress,
      );
      await expect(
        service.completeLesson(STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.completeLesson(STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow('Lesson already marked as complete.');
    });

    it('should create new LessonProgress and update enrollment for first completion', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.lessonProgress.findUnique.mockResolvedValue(null);
      mockPrismaService.lessonProgress.upsert.mockResolvedValue(
        mockCompletedLessonProgress,
      );
      mockPrismaService.lesson.count.mockResolvedValue(2); // 2 lessons total
      mockPrismaService.lessonProgress.count.mockResolvedValue(1); // 1 completed
      mockPrismaService.enrollment.update.mockResolvedValue({
        ...mockEnrollment,
        progress: 50,
      });

      const result = await service.completeLesson(
        STUDENT_ID,
        COURSE_ID,
        LESSON_ID,
      );

      expect(result.lessonProgress.completed).toBe(true);
      expect(result.enrollment.progress).toBe(50);
      expect(mockPrismaService.lessonProgress.upsert).toHaveBeenCalledWith({
        where: {
          studentId_lessonId: { studentId: STUDENT_ID, lessonId: LESSON_ID },
        },
        create: expect.objectContaining({
          studentId: STUDENT_ID,
          lessonId: LESSON_ID,
          courseId: COURSE_ID,
          completed: true,
        }),
        update: expect.objectContaining({
          completed: true,
        }),
      });
    });

    it('should update existing incomplete LessonProgress to completed', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.lessonProgress.findUnique.mockResolvedValue(
        mockLessonProgress, // exists but not completed
      );
      mockPrismaService.lessonProgress.upsert.mockResolvedValue({
        ...mockLessonProgress,
        completed: true,
        completedAt: new Date(),
      });
      mockPrismaService.lesson.count.mockResolvedValue(1);
      mockPrismaService.lessonProgress.count.mockResolvedValue(1);
      mockPrismaService.enrollment.update.mockResolvedValue({
        ...mockEnrollment,
        progress: 100,
        status: 'COMPLETED',
      });

      const result = await service.completeLesson(
        STUDENT_ID,
        COURSE_ID,
        LESSON_ID,
      );

      expect(result.lessonProgress.completed).toBe(true);
      expect(result.enrollment.progress).toBe(100);
      expect(result.enrollment.status).toBe('COMPLETED');
    });

    it('should set enrollment status to COMPLETED at 100% progress', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.lessonProgress.findUnique.mockResolvedValue(null);
      mockPrismaService.lessonProgress.upsert.mockResolvedValue(
        mockCompletedLessonProgress,
      );
      mockPrismaService.lesson.count.mockResolvedValue(1); // 1 lesson total
      mockPrismaService.lessonProgress.count.mockResolvedValue(1); // 1 completed = 100%
      const updatedEnrollment = {
        ...mockEnrollment,
        progress: 100,
        status: 'COMPLETED',
      };
      mockPrismaService.enrollment.update.mockResolvedValue(updatedEnrollment);

      const result = await service.completeLesson(
        STUDENT_ID,
        COURSE_ID,
        LESSON_ID,
      );

      expect(result.enrollment.status).toBe('COMPLETED');
      expect(mockPrismaService.enrollment.update).toHaveBeenCalledWith({
        where: { id: ENROLLMENT_ID },
        data: { progress: 100, status: 'COMPLETED' },
      });
    });

    it('should calculate 50% progress for 1 of 2 lessons', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.lessonProgress.findUnique.mockResolvedValue(null);
      mockPrismaService.lessonProgress.upsert.mockResolvedValue(
        mockCompletedLessonProgress,
      );
      mockPrismaService.lesson.count.mockResolvedValue(2);
      mockPrismaService.lessonProgress.count.mockResolvedValue(1);
      mockPrismaService.enrollment.update.mockResolvedValue({
        ...mockEnrollment,
        progress: 50,
        status: 'ACTIVE',
      });

      const result = await service.completeLesson(
        STUDENT_ID,
        COURSE_ID,
        LESSON_ID,
      );

      expect(result.enrollment.progress).toBe(50);
      expect(result.enrollment.status).toBe('ACTIVE');
    });

    it('should handle course with zero lessons (progress stays 0)', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.lessonProgress.findUnique.mockResolvedValue(null);
      mockPrismaService.lessonProgress.upsert.mockResolvedValue(
        mockCompletedLessonProgress,
      );
      mockPrismaService.lesson.count.mockResolvedValue(0); // edge case: 0 lessons
      mockPrismaService.enrollment.update.mockResolvedValue({
        ...mockEnrollment,
        progress: 0,
      });

      const result = await service.completeLesson(
        STUDENT_ID,
        COURSE_ID,
        LESSON_ID,
      );

      expect(result.enrollment.progress).toBe(0);
      expect(mockPrismaService.enrollment.update).toHaveBeenCalledWith({
        where: { id: ENROLLMENT_ID },
        data: { progress: 0 },
      });
    });

    it('should round progress to nearest integer (3 of 7 lessons = 43%)', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.lessonProgress.findUnique.mockResolvedValue(null);
      mockPrismaService.lessonProgress.upsert.mockResolvedValue(
        mockCompletedLessonProgress,
      );
      mockPrismaService.lesson.count.mockResolvedValue(7);
      mockPrismaService.lessonProgress.count.mockResolvedValue(3);
      mockPrismaService.enrollment.update.mockResolvedValue({
        ...mockEnrollment,
        progress: 43, // Math.round(3/7*100) = 43
      });

      const result = await service.completeLesson(
        STUDENT_ID,
        COURSE_ID,
        LESSON_ID,
      );

      expect(result.enrollment.progress).toBe(43);
    });
  });

  /* ── accessLesson ─────────────────────────────────────────── */
  describe('accessLesson', () => {
    it('should throw ForbiddenException if student not enrolled', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);
      await expect(
        service.accessLesson(STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if lesson does not exist', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(null);
      await expect(
        service.accessLesson(STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if lesson belongs to different course', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(
        mockLessonOtherCourse,
      );
      await expect(
        service.accessLesson(STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create new incomplete LessonProgress on first access', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.lessonProgress.upsert.mockResolvedValue(
        mockLessonProgress,
      );

      const result = await service.accessLesson(
        STUDENT_ID,
        COURSE_ID,
        LESSON_ID,
      );

      expect(result.completed).toBe(false);
      expect(mockPrismaService.lessonProgress.upsert).toHaveBeenCalledWith({
        where: {
          studentId_lessonId: { studentId: STUDENT_ID, lessonId: LESSON_ID },
        },
        create: expect.objectContaining({
          studentId: STUDENT_ID,
          lessonId: LESSON_ID,
          courseId: COURSE_ID,
          completed: false,
        }),
        update: expect.objectContaining({
          lastAccessedAt: expect.any(Date),
        }),
      });
    });

    it('should update lastAccessedAt on repeated access without changing completion', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      const now = new Date();
      mockPrismaService.lessonProgress.upsert.mockResolvedValue({
        ...mockCompletedLessonProgress,
        lastAccessedAt: now,
      });

      const result = await service.accessLesson(
        STUDENT_ID,
        COURSE_ID,
        LESSON_ID,
      );

      expect(result.lastAccessedAt).toEqual(now);
      expect(mockPrismaService.lessonProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            lastAccessedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  /* ── getCourseProgress ────────────────────────────────────── */
  describe('getCourseProgress', () => {
    it('should throw ForbiddenException if student not enrolled', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);
      await expect(
        service.getCourseProgress(STUDENT_ID, COURSE_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return enrollment and empty progress for new enrollment', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lessonProgress.findMany.mockResolvedValue([]);

      const result = await service.getCourseProgress(STUDENT_ID, COURSE_ID);

      expect(result.enrollment).toEqual(mockEnrollment);
      expect(result.lessonProgress).toEqual([]);
      expect(result.completedLessonIds).toEqual([]);
    });

    it('should return all lesson progress records ordered by lastAccessedAt desc', async () => {
      const progress1 = {
        ...mockLessonProgress,
        lessonId: LESSON_ID,
        completed: true,
        lastAccessedAt: new Date('2026-01-01'),
      };
      const progress2 = {
        ...mockLessonProgress,
        lessonId: LESSON_ID_2,
        completed: false,
        lastAccessedAt: new Date('2026-01-02'),
      };
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lessonProgress.findMany.mockResolvedValue([
        progress2,
        progress1,
      ]);

      const result = await service.getCourseProgress(STUDENT_ID, COURSE_ID);

      expect(result.lessonProgress).toHaveLength(2);
      expect(result.completedLessonIds).toEqual([LESSON_ID]);
      expect(mockPrismaService.lessonProgress.findMany).toHaveBeenCalledWith({
        where: { studentId: STUDENT_ID, courseId: COURSE_ID },
        orderBy: { lastAccessedAt: 'desc' },
      });
    });

    it('should filter completedLessonIds correctly (only completed=true)', async () => {
      const progress1 = {
        ...mockLessonProgress,
        lessonId: LESSON_ID,
        completed: true,
      };
      const progress2 = {
        ...mockLessonProgress,
        lessonId: LESSON_ID_2,
        completed: false,
      };
      const progress3 = {
        ...mockLessonProgress,
        lessonId: 'lesson-3',
        completed: true,
      };
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lessonProgress.findMany.mockResolvedValue([
        progress1,
        progress2,
        progress3,
      ]);

      const result = await service.getCourseProgress(STUDENT_ID, COURSE_ID);

      expect(result.completedLessonIds).toEqual([LESSON_ID, 'lesson-3']);
      expect(result.completedLessonIds).not.toContain(LESSON_ID_2);
    });
  });

  /* ── getLessonProgress ────────────────────────────────────── */
  describe('getLessonProgress', () => {
    it('should throw ForbiddenException if student not enrolled', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);
      await expect(
        service.getLessonProgress(STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if lesson does not exist', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(null);
      await expect(
        service.getLessonProgress(STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if lesson belongs to different course', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(
        mockLessonOtherCourse,
      );
      await expect(
        service.getLessonProgress(STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return false for completed if no progress record exists', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.lessonProgress.findUnique.mockResolvedValue(null);

      const result = await service.getLessonProgress(
        STUDENT_ID,
        COURSE_ID,
        LESSON_ID,
      );

      expect(result.lessonId).toBe(LESSON_ID);
      expect(result.completed).toBe(false);
      expect(result.completedAt).toBeNull();
      expect(result.lastAccessedAt).toBeNull();
    });

    it('should return completion status for completed lesson', async () => {
      const completedDate = new Date('2026-01-01');
      const accessedDate = new Date('2026-01-02');
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.lessonProgress.findUnique.mockResolvedValue({
        ...mockLessonProgress,
        completed: true,
        completedAt: completedDate,
        lastAccessedAt: accessedDate,
      });

      const result = await service.getLessonProgress(
        STUDENT_ID,
        COURSE_ID,
        LESSON_ID,
      );

      expect(result.lessonId).toBe(LESSON_ID);
      expect(result.completed).toBe(true);
      expect(result.completedAt).toEqual(completedDate);
      expect(result.lastAccessedAt).toEqual(accessedDate);
    });

    it('should return incomplete status for accessed but not completed lesson', async () => {
      const accessedDate = new Date('2026-01-01');
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.lessonProgress.findUnique.mockResolvedValue({
        ...mockLessonProgress,
        completed: false,
        completedAt: null,
        lastAccessedAt: accessedDate,
      });

      const result = await service.getLessonProgress(
        STUDENT_ID,
        COURSE_ID,
        LESSON_ID,
      );

      expect(result.completed).toBe(false);
      expect(result.completedAt).toBeNull();
      expect(result.lastAccessedAt).toEqual(accessedDate);
    });
  });

  /* ── Edge case: Student accessing another student's progress ─ */
  describe('Security: Student isolation', () => {
    it('should prevent student from completing lesson in course they are not enrolled in', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);
      await expect(
        service.completeLesson(OTHER_STUDENT_ID, COURSE_ID, LESSON_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent student from accessing progress of course they are not enrolled in', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);
      await expect(
        service.getCourseProgress(OTHER_STUDENT_ID, COURSE_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should only return progress for the authenticated student', async () => {
      const student1Progress = {
        ...mockLessonProgress,
        studentId: STUDENT_ID,
        lessonId: LESSON_ID,
      };
      mockPrismaService.enrollment.findFirst.mockResolvedValue({
        ...mockEnrollment,
        studentId: STUDENT_ID,
      });
      mockPrismaService.lessonProgress.findMany.mockResolvedValue([
        student1Progress,
      ]);

      const result = await service.getCourseProgress(STUDENT_ID, COURSE_ID);

      expect(mockPrismaService.lessonProgress.findMany).toHaveBeenCalledWith({
        where: { studentId: STUDENT_ID, courseId: COURSE_ID },
        orderBy: { lastAccessedAt: 'desc' },
      });
      expect(result.lessonProgress[0].studentId).toBe(STUDENT_ID);
    });
  });
});
