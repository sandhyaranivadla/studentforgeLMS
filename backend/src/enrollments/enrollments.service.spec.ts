import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsService } from './enrollments.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

/* ── Mock Prisma ──────────────────────────────────────────── */
const mockPrismaService = {
  enrollment: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  course: {
    findUnique: jest.fn(),
  },
};

/* ── Fixtures ─────────────────────────────────────────────── */
const STUDENT_ID = 'student-1';
const OTHER_STUDENT_ID = 'student-2';
const COURSE_ID = 'course-1';
const ENROLLMENT_ID = 'enrollment-1';
const INSTRUCTOR_ID = 'instructor-1';

const mockPublishedCourse = {
  id: COURSE_ID,
  title: 'Test Course',
  published: true,
  instructorId: INSTRUCTOR_ID,
};

const mockUnpublishedCourse = { ...mockPublishedCourse, published: false };

const mockEnrollment = {
  id: ENROLLMENT_ID,
  studentId: STUDENT_ID,
  courseId: COURSE_ID,
  progress: 0,
  status: 'ACTIVE',
  course: mockPublishedCourse,
};

const mockOtherStudentEnrollment = {
  ...mockEnrollment,
  id: 'enrollment-2',
  studentId: OTHER_STUDENT_ID,
};

/* ── Test Suite ───────────────────────────────────────────── */
describe('EnrollmentsService', () => {
  let service: EnrollmentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ── checkEnrollment ──────────────────────────────────── */
  describe('checkEnrollment', () => {
    it('should return enrolled=true when enrollment exists', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      const result = await service.checkEnrollment(STUDENT_ID, COURSE_ID);
      expect(result.enrolled).toBe(true);
      expect(result.enrollment).toEqual(mockEnrollment);
    });

    it('should return enrolled=false when enrollment does not exist', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);
      const result = await service.checkEnrollment(STUDENT_ID, COURSE_ID);
      expect(result.enrolled).toBe(false);
      expect(result.enrollment).toBeNull();
    });
  });

  /* ── create ───────────────────────────────────────────── */
  describe('create', () => {
    it('should throw ConflictException if student is already enrolled', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      await expect(
        service.create(STUDENT_ID, { courseId: COURSE_ID }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if course does not exist', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);
      mockPrismaService.course.findUnique.mockResolvedValue(null);
      await expect(
        service.create(STUDENT_ID, { courseId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if course is not published', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);
      mockPrismaService.course.findUnique.mockResolvedValue(
        mockUnpublishedCourse,
      );
      await expect(
        service.create(STUDENT_ID, { courseId: COURSE_ID }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create enrollment in a published course', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);
      mockPrismaService.course.findUnique.mockResolvedValue(
        mockPublishedCourse,
      );
      mockPrismaService.enrollment.create.mockResolvedValue(mockEnrollment);
      const result = await service.create(STUDENT_ID, { courseId: COURSE_ID });
      expect(mockPrismaService.enrollment.create).toHaveBeenCalledWith({
        data: { studentId: STUDENT_ID, courseId: COURSE_ID },
      });
      expect(result).toEqual(mockEnrollment);
    });

    it('should call findFirst with correct studentId and courseId to check duplicates', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(mockEnrollment);
      await expect(
        service.create(STUDENT_ID, { courseId: COURSE_ID }),
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.enrollment.findFirst).toHaveBeenCalledWith({
        where: { studentId: STUDENT_ID, courseId: COURSE_ID },
      });
    });
  });

  /* ── findAll ──────────────────────────────────────────── */
  describe('findAll', () => {
    it('should return only own enrollments for STUDENT', async () => {
      mockPrismaService.enrollment.findMany.mockResolvedValue([mockEnrollment]);
      await service.findAll(STUDENT_ID, Role.STUDENT);
      expect(mockPrismaService.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { studentId: STUDENT_ID } }),
      );
    });

    it('should return course-filtered enrollments for INSTRUCTOR', async () => {
      mockPrismaService.enrollment.findMany.mockResolvedValue([mockEnrollment]);
      await service.findAll(INSTRUCTOR_ID, Role.INSTRUCTOR);
      expect(mockPrismaService.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { course: { instructorId: INSTRUCTOR_ID } },
        }),
      );
    });

    it('should return all enrollments for ADMIN', async () => {
      mockPrismaService.enrollment.findMany.mockResolvedValue([
        mockEnrollment,
        mockOtherStudentEnrollment,
      ]);
      const result = await service.findAll('admin-1', Role.ADMIN);
      const calls = mockPrismaService.enrollment.findMany.mock.calls as [
        { where?: Record<string, unknown> },
      ][];
      expect(calls[0][0].where).toBeUndefined();
      expect(result).toHaveLength(2);
    });
  });

  /* ── findOne ──────────────────────────────────────────── */
  describe('findOne', () => {
    it('should throw NotFoundException if enrollment does not exist', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(null);
      await expect(
        service.findOne(ENROLLMENT_ID, STUDENT_ID, Role.STUDENT),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if student accesses another student enrollment', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(
        mockOtherStudentEnrollment,
      );
      await expect(
        service.findOne(ENROLLMENT_ID, STUDENT_ID, Role.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow student to view their own enrollment', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      const result = await service.findOne(
        ENROLLMENT_ID,
        STUDENT_ID,
        Role.STUDENT,
      );
      expect(result).toEqual(mockEnrollment);
    });

    it('should allow ADMIN to view any enrollment', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      const result = await service.findOne(
        ENROLLMENT_ID,
        'admin-1',
        Role.ADMIN,
      );
      expect(result).toEqual(mockEnrollment);
    });
  });

  /* ── update ───────────────────────────────────────────── */
  describe('update', () => {
    it('should throw NotFoundException if enrollment does not exist', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(null);
      await expect(
        service.update(
          ENROLLMENT_ID,
          STUDENT_ID,
          { progress: 50 },
          Role.STUDENT,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if student updates another student enrollment', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(
        mockOtherStudentEnrollment,
      );
      await expect(
        service.update(
          ENROLLMENT_ID,
          STUDENT_ID,
          { progress: 50 },
          Role.STUDENT,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow student to update their own enrollment progress', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockPrismaService.enrollment.update.mockResolvedValue({
        ...mockEnrollment,
        progress: 50,
      });
      const result = await service.update(
        ENROLLMENT_ID,
        STUDENT_ID,
        { progress: 50 },
        Role.STUDENT,
      );
      expect(result.progress).toEqual(50);
    });

    it('should allow ADMIN to update any enrollment', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(
        mockOtherStudentEnrollment,
      );
      mockPrismaService.enrollment.update.mockResolvedValue({
        ...mockOtherStudentEnrollment,
        status: 'COMPLETED',
      });
      const result = await service.update(
        'enrollment-2',
        'admin-1',
        { status: 'COMPLETED' },
        Role.ADMIN,
      );
      expect(result.status).toEqual('COMPLETED');
    });
  });

  /* ── remove ───────────────────────────────────────────── */
  describe('remove', () => {
    it('should throw NotFoundException if enrollment does not exist', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(null);
      await expect(
        service.remove(ENROLLMENT_ID, STUDENT_ID, Role.STUDENT),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if student removes another student enrollment', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(
        mockOtherStudentEnrollment,
      );
      await expect(
        service.remove(ENROLLMENT_ID, STUDENT_ID, Role.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow student to remove their own enrollment', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockPrismaService.enrollment.delete.mockResolvedValue(mockEnrollment);
      await service.remove(ENROLLMENT_ID, STUDENT_ID, Role.STUDENT);
      expect(mockPrismaService.enrollment.delete).toHaveBeenCalledWith({
        where: { id: ENROLLMENT_ID },
      });
    });

    it('should allow ADMIN to remove any enrollment', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(
        mockOtherStudentEnrollment,
      );
      mockPrismaService.enrollment.delete.mockResolvedValue(
        mockOtherStudentEnrollment,
      );
      await service.remove('enrollment-2', 'admin-1', Role.ADMIN);
      expect(mockPrismaService.enrollment.delete).toHaveBeenCalled();
    });
  });
});
