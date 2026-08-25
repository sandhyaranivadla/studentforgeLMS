import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

/* ── Mock Prisma ──────────────────────────────────────────── */
const mockPrismaService = {
  course: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  courseModule: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  lesson: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

/* ── Fixtures ─────────────────────────────────────────────── */
const INSTRUCTOR_ID = 'instructor-1';
const OTHER_INSTRUCTOR_ID = 'instructor-2';
const COURSE_ID = 'course-1';
const MODULE_ID = 'module-1';
const LESSON_ID = 'lesson-1';

const mockCourse = {
  id: COURSE_ID,
  title: 'Test Course',
  description: 'A test course',
  price: 0,
  published: true,
  instructorId: INSTRUCTOR_ID,
};

const mockUnpublishedCourse = { ...mockCourse, published: false };

const mockModule = {
  id: MODULE_ID,
  title: 'Module 1',
  courseId: COURSE_ID,
  orderIndex: 1,
  course: mockCourse,
};

const mockModuleOtherInstructor = {
  ...mockModule,
  course: { ...mockCourse, instructorId: OTHER_INSTRUCTOR_ID },
};

const mockLesson = {
  id: LESSON_ID,
  title: 'Lesson 1',
  type: 'VIDEO',
  orderIndex: 1,
  moduleId: MODULE_ID,
  module: {
    ...mockModule,
    course: mockCourse,
  },
};

const mockLessonOtherInstructor = {
  ...mockLesson,
  module: {
    ...mockModule,
    course: { ...mockCourse, instructorId: OTHER_INSTRUCTOR_ID },
  },
};

/* ── Test Suite ───────────────────────────────────────────── */
describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ── createCourse ─────────────────────────────────────── */
  describe('createCourse', () => {
    it('should create a course with instructorId set from userId', async () => {
      mockPrismaService.course.create.mockResolvedValue(mockCourse);
      await service.createCourse(INSTRUCTOR_ID, {
        title: 'Test Course',
        description: 'A test course',
      });
      expect(mockPrismaService.course.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ instructorId: INSTRUCTOR_ID }),
      });
    });
  });

  /* ── findAll ──────────────────────────────────────────── */
  describe('findAll', () => {
    it('should filter published=true for STUDENT role', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      await service.findAll(Role.STUDENT, 'student-1');
      expect(mockPrismaService.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { published: true } }),
      );
    });

    it('should filter by instructorId for INSTRUCTOR role', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      await service.findAll(Role.INSTRUCTOR, INSTRUCTOR_ID);
      expect(mockPrismaService.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { instructorId: INSTRUCTOR_ID } }),
      );
    });

    it('should return all courses for ADMIN role with no where filter', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      await service.findAll(Role.ADMIN, 'admin-1');
      const [firstCall] = mockPrismaService.course.findMany.mock.calls as [
        { where: Record<string, unknown> },
      ][];
      expect(
        (firstCall as [{ where: Record<string, unknown> }])[0].where,
      ).toEqual({});
    });

    it('should return all published courses when no role provided (public access)', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      await service.findAll(undefined, undefined);
      const [firstCallPublic] = mockPrismaService.course.findMany.mock
        .calls as [{ where: Record<string, unknown> }][];
      expect(
        (firstCallPublic as [{ where: Record<string, unknown> }])[0].where,
      ).toEqual({});
    });
  });

  /* ── findOne ──────────────────────────────────────────── */
  describe('findOne', () => {
    it('should throw NotFoundException if course does not exist', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent', Role.ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for STUDENT viewing unpublished course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(
        mockUnpublishedCourse,
      );
      await expect(service.findOne(COURSE_ID, Role.STUDENT)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow STUDENT to view a published course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      const result = await service.findOne(COURSE_ID, Role.STUDENT);
      expect(result.id).toEqual(COURSE_ID);
    });

    it('should allow INSTRUCTOR to view an unpublished course (no role restriction)', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(
        mockUnpublishedCourse,
      );
      const result = await service.findOne(COURSE_ID, Role.INSTRUCTOR);
      expect(result.id).toEqual(COURSE_ID);
    });

    it('should allow ADMIN to view an unpublished course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(
        mockUnpublishedCourse,
      );
      const result = await service.findOne(COURSE_ID, Role.ADMIN);
      expect(result.id).toEqual(COURSE_ID);
    });
  });

  /* ── updateCourse ─────────────────────────────────────── */
  describe('updateCourse', () => {
    it('should throw NotFoundException if course not found', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);
      await expect(
        service.updateCourse(
          COURSE_ID,
          INSTRUCTOR_ID,
          { title: 'New' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if instructor updates another instructor course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        ...mockCourse,
        instructorId: OTHER_INSTRUCTOR_ID,
      });
      await expect(
        service.updateCourse(
          COURSE_ID,
          INSTRUCTOR_ID,
          { title: 'New' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow instructor to update their own course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.course.update.mockResolvedValue({
        ...mockCourse,
        title: 'Updated',
      });
      const result = await service.updateCourse(
        COURSE_ID,
        INSTRUCTOR_ID,
        { title: 'Updated' },
        Role.INSTRUCTOR,
      );
      expect(result.title).toEqual('Updated');
    });

    it('should allow ADMIN to update any course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        ...mockCourse,
        instructorId: OTHER_INSTRUCTOR_ID,
      });
      mockPrismaService.course.update.mockResolvedValue({
        ...mockCourse,
        published: true,
      });
      const result = await service.updateCourse(
        COURSE_ID,
        'admin-1',
        { published: true },
        Role.ADMIN,
      );
      expect(mockPrismaService.course.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should allow INSTRUCTOR to publish their own course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(
        mockUnpublishedCourse,
      );
      mockPrismaService.course.update.mockResolvedValue({
        ...mockUnpublishedCourse,
        published: true,
      });
      const result = await service.updateCourse(
        COURSE_ID,
        INSTRUCTOR_ID,
        { published: true },
        Role.INSTRUCTOR,
      );
      expect(result.published).toBe(true);
    });
  });

  /* ── removeCourse ─────────────────────────────────────── */
  describe('removeCourse', () => {
    it('should throw NotFoundException if course not found', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);
      await expect(
        service.removeCourse(COURSE_ID, INSTRUCTOR_ID, Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if instructor deletes another instructor course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        ...mockCourse,
        instructorId: OTHER_INSTRUCTOR_ID,
      });
      await expect(
        service.removeCourse(COURSE_ID, INSTRUCTOR_ID, Role.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow instructor to delete their own course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.course.delete.mockResolvedValue(mockCourse);
      const result = await service.removeCourse(
        COURSE_ID,
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
      );
      expect(mockPrismaService.course.delete).toHaveBeenCalledWith({
        where: { id: COURSE_ID },
      });
      expect(result).toEqual(mockCourse);
    });

    it('should allow ADMIN to delete any course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        ...mockCourse,
        instructorId: OTHER_INSTRUCTOR_ID,
      });
      mockPrismaService.course.delete.mockResolvedValue(mockCourse);
      await service.removeCourse(COURSE_ID, 'admin-1', Role.ADMIN);
      expect(mockPrismaService.course.delete).toHaveBeenCalled();
    });
  });

  /* ── createModule ─────────────────────────────────────── */
  describe('createModule', () => {
    it('should throw NotFoundException if course not found', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);
      await expect(
        service.createModule(
          COURSE_ID,
          INSTRUCTOR_ID,
          { title: 'M1', orderIndex: 1 },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner instructor', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        ...mockCourse,
        instructorId: OTHER_INSTRUCTOR_ID,
      });
      await expect(
        service.createModule(
          COURSE_ID,
          INSTRUCTOR_ID,
          { title: 'M1', orderIndex: 1 },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create a module for the course owner', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.courseModule.create.mockResolvedValue({
        id: MODULE_ID,
        title: 'M1',
        courseId: COURSE_ID,
        orderIndex: 1,
      });
      const result = await service.createModule(
        COURSE_ID,
        INSTRUCTOR_ID,
        { title: 'M1', orderIndex: 1 },
        Role.INSTRUCTOR,
      );
      expect(result.courseId).toEqual(COURSE_ID);
    });
  });

  /* ── updateModule ─────────────────────────────────────── */
  describe('updateModule', () => {
    it('should throw NotFoundException if module not found', async () => {
      mockPrismaService.courseModule.findUnique.mockResolvedValue(null);
      await expect(
        service.updateModule(
          MODULE_ID,
          INSTRUCTOR_ID,
          { title: 'X' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner', async () => {
      mockPrismaService.courseModule.findUnique.mockResolvedValue(
        mockModuleOtherInstructor,
      );
      await expect(
        service.updateModule(
          MODULE_ID,
          INSTRUCTOR_ID,
          { title: 'X' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to update module', async () => {
      mockPrismaService.courseModule.findUnique.mockResolvedValue(mockModule);
      mockPrismaService.courseModule.update.mockResolvedValue({
        ...mockModule,
        title: 'Updated',
      });
      const result = await service.updateModule(
        MODULE_ID,
        INSTRUCTOR_ID,
        { title: 'Updated' },
        Role.INSTRUCTOR,
      );
      expect(result.title).toEqual('Updated');
    });
  });

  /* ── removeModule ─────────────────────────────────────── */
  describe('removeModule', () => {
    it('should throw NotFoundException if module not found', async () => {
      mockPrismaService.courseModule.findUnique.mockResolvedValue(null);
      await expect(
        service.removeModule(MODULE_ID, INSTRUCTOR_ID, Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner', async () => {
      mockPrismaService.courseModule.findUnique.mockResolvedValue(
        mockModuleOtherInstructor,
      );
      await expect(
        service.removeModule(MODULE_ID, INSTRUCTOR_ID, Role.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to delete any module', async () => {
      mockPrismaService.courseModule.findUnique.mockResolvedValue(
        mockModuleOtherInstructor,
      );
      mockPrismaService.courseModule.delete.mockResolvedValue(mockModule);
      await service.removeModule(MODULE_ID, 'admin-1', Role.ADMIN);
      expect(mockPrismaService.courseModule.delete).toHaveBeenCalledWith({
        where: { id: MODULE_ID },
      });
    });
  });

  /* ── createLesson ─────────────────────────────────────── */
  describe('createLesson', () => {
    it('should throw NotFoundException if module not found', async () => {
      mockPrismaService.courseModule.findUnique.mockResolvedValue(null);
      await expect(
        service.createLesson(
          MODULE_ID,
          INSTRUCTOR_ID,
          { title: 'L1', type: 'VIDEO', orderIndex: 1 },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner instructor', async () => {
      mockPrismaService.courseModule.findUnique.mockResolvedValue(
        mockModuleOtherInstructor,
      );
      await expect(
        service.createLesson(
          MODULE_ID,
          INSTRUCTOR_ID,
          { title: 'L1', type: 'VIDEO', orderIndex: 1 },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create a lesson for the module owner', async () => {
      mockPrismaService.courseModule.findUnique.mockResolvedValue(mockModule);
      mockPrismaService.lesson.create.mockResolvedValue({
        id: LESSON_ID,
        title: 'L1',
        type: 'VIDEO',
        moduleId: MODULE_ID,
        orderIndex: 1,
      });
      const result = await service.createLesson(
        MODULE_ID,
        INSTRUCTOR_ID,
        { title: 'L1', type: 'VIDEO', orderIndex: 1 },
        Role.INSTRUCTOR,
      );
      expect(result.moduleId).toEqual(MODULE_ID);
    });

    it('should create a lesson with contentUrl', async () => {
      mockPrismaService.courseModule.findUnique.mockResolvedValue(mockModule);
      const lessonWithUrl = {
        id: LESSON_ID,
        title: 'L1',
        type: 'VIDEO',
        contentUrl: 'https://example.com/video.mp4',
        moduleId: MODULE_ID,
        orderIndex: 1,
      };
      mockPrismaService.lesson.create.mockResolvedValue(lessonWithUrl);
      const result = await service.createLesson(
        MODULE_ID,
        INSTRUCTOR_ID,
        {
          title: 'L1',
          type: 'VIDEO',
          contentUrl: 'https://example.com/video.mp4',
          orderIndex: 1,
        },
        Role.INSTRUCTOR,
      );
      expect(result.contentUrl).toEqual('https://example.com/video.mp4');
    });
  });

  /* ── updateLesson ─────────────────────────────────────── */
  describe('updateLesson', () => {
    it('should throw NotFoundException if lesson not found', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(null);
      await expect(
        service.updateLesson(
          LESSON_ID,
          INSTRUCTOR_ID,
          { title: 'X' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(
        mockLessonOtherInstructor,
      );
      await expect(
        service.updateLesson(
          LESSON_ID,
          INSTRUCTOR_ID,
          { title: 'X' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to update lesson', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.lesson.update.mockResolvedValue({
        ...mockLesson,
        title: 'Updated Lesson',
      });
      const result = await service.updateLesson(
        LESSON_ID,
        INSTRUCTOR_ID,
        { title: 'Updated Lesson' },
        Role.INSTRUCTOR,
      );
      expect(result.title).toEqual('Updated Lesson');
    });

    it('should allow ADMIN to update any lesson', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(
        mockLessonOtherInstructor,
      );
      mockPrismaService.lesson.update.mockResolvedValue(mockLesson);
      await service.updateLesson(
        LESSON_ID,
        'admin-1',
        { title: 'X' },
        Role.ADMIN,
      );
      expect(mockPrismaService.lesson.update).toHaveBeenCalled();
    });
  });

  /* ── removeLesson ─────────────────────────────────────── */
  describe('removeLesson', () => {
    it('should throw NotFoundException if lesson not found', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(null);
      await expect(
        service.removeLesson(LESSON_ID, INSTRUCTOR_ID, Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(
        mockLessonOtherInstructor,
      );
      await expect(
        service.removeLesson(LESSON_ID, INSTRUCTOR_ID, Role.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to delete lesson', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.lesson.delete.mockResolvedValue(mockLesson);
      await service.removeLesson(LESSON_ID, INSTRUCTOR_ID, Role.INSTRUCTOR);
      expect(mockPrismaService.lesson.delete).toHaveBeenCalledWith({
        where: { id: LESSON_ID },
      });
    });
  });
});
