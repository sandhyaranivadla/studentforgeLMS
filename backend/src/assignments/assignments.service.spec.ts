import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsService } from './assignments.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  assignment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  assignmentSubmission: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  course: {
    findUnique: jest.fn(),
  },
  courseModule: {
    findUnique: jest.fn(),
  },
  enrollment: {
    findFirst: jest.fn(),
  },
};

const INSTRUCTOR_ID = 'instructor-1';
const OTHER_INSTRUCTOR_ID = 'instructor-2';
const STUDENT_ID = 'student-1';
const COURSE_ID = 'course-1';
const MODULE_ID = 'module-1';
const ASSIGNMENT_ID = 'assignment-1';
const SUBMISSION_ID = 'submission-1';

const mockCourse = {
  id: COURSE_ID,
  title: 'Test Course',
  instructorId: INSTRUCTOR_ID,
  published: true,
};

const mockModule = {
  id: MODULE_ID,
  title: 'Module 1',
  courseId: COURSE_ID,
  orderIndex: 1,
};

const mockAssignment = {
  id: ASSIGNMENT_ID,
  courseId: COURSE_ID,
  moduleId: null,
  title: 'Assignment 1',
  description: 'Test assignment',
  instructions: 'Do the work',
  dueDate: new Date('2026-12-31'),
  maxMarks: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
  course: mockCourse,
  module: null,
  submissions: [],
};

const mockSubmission = {
  id: SUBMISSION_ID,
  assignmentId: ASSIGNMENT_ID,
  studentId: STUDENT_ID,
  submissionText: 'My submission',
  marks: null,
  feedback: null,
  submittedAt: new Date(),
  gradedAt: null,
  updatedAt: new Date(),
};

describe('AssignmentsService', () => {
  let service: AssignmentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ── createAssignment ─────────────────────────────────────── */
  describe('createAssignment', () => {
    it('should create assignment for instructor in their course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.assignment.create.mockResolvedValue(mockAssignment);

      const result = await service.createAssignment(
        COURSE_ID,
        INSTRUCTOR_ID,
        { title: 'Assignment 1', description: 'Test' },
        Role.INSTRUCTOR,
      );

      expect(result).toEqual(mockAssignment);
      expect(mockPrismaService.assignment.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if instructor tries to create in another instructor course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      await expect(
        service.createAssignment(
          COURSE_ID,
          OTHER_INSTRUCTOR_ID,
          { title: 'Assignment', description: 'Test' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to create assignment in any course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.assignment.create.mockResolvedValue(mockAssignment);

      const result = await service.createAssignment(
        COURSE_ID,
        'admin-1',
        { title: 'Assignment', description: 'Test' },
        Role.ADMIN,
      );

      expect(result).toBeDefined();
      expect(mockPrismaService.assignment.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if course does not exist', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);

      await expect(
        service.createAssignment(
          'nonexistent',
          INSTRUCTOR_ID,
          { title: 'Assignment', description: 'Test' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if moduleId does not exist', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.courseModule.findUnique.mockResolvedValue(null);

      await expect(
        service.createAssignment(
          COURSE_ID,
          INSTRUCTOR_ID,
          { title: 'Assignment', description: 'Test', moduleId: 'bad-id' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if moduleId belongs to different course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.courseModule.findUnique.mockResolvedValue({
        ...mockModule,
        courseId: 'other-course-id',
      });

      await expect(
        service.createAssignment(
          COURSE_ID,
          INSTRUCTOR_ID,
          { title: 'Assignment', description: 'Test', moduleId: MODULE_ID },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /* ── findAllByCourse ──────────────────────────────────────── */
  describe('findAllByCourse', () => {
    it('should return assignments for instructor in their course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.assignment.findMany.mockResolvedValue([mockAssignment]);

      const result = await service.findAllByCourse(
        COURSE_ID,
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
      );

      expect(result).toEqual([mockAssignment]);
      expect(mockPrismaService.assignment.findMany).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if instructor tries to view another instructor course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      await expect(
        service.findAllByCourse(
          COURSE_ID,
          OTHER_INSTRUCTOR_ID,
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return assignments for enrolled student', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        studentId: STUDENT_ID,
        courseId: COURSE_ID,
      });
      mockPrismaService.assignment.findMany.mockResolvedValue([mockAssignment]);

      const result = await service.findAllByCourse(
        COURSE_ID,
        STUDENT_ID,
        Role.STUDENT,
      );

      expect(result).toEqual([mockAssignment]);
    });

    it('should throw ForbiddenException if student is not enrolled', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.findAllByCourse(COURSE_ID, STUDENT_ID, Role.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return all assignments for ADMIN', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.assignment.findMany.mockResolvedValue([mockAssignment]);

      const result = await service.findAllByCourse(
        COURSE_ID,
        'admin-1',
        Role.ADMIN,
      );

      expect(result).toEqual([mockAssignment]);
    });
  });

  /* ── findOne ──────────────────────────────────────────────── */
  describe('findOne', () => {
    it('should return assignment for enrolled student', async () => {
      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);
      mockPrismaService.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
      });

      const result = await service.findOne(
        ASSIGNMENT_ID,
        STUDENT_ID,
        Role.STUDENT,
      );

      expect(result).toEqual(mockAssignment);
    });

    it('should throw ForbiddenException if student not enrolled', async () => {
      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(ASSIGNMENT_ID, STUDENT_ID, Role.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if assignment does not exist', async () => {
      mockPrismaService.assignment.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(ASSIGNMENT_ID, INSTRUCTOR_ID, Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /* ── updateAssignment ─────────────────────────────────────── */
  describe('updateAssignment', () => {
    it('should update assignment for instructor', async () => {
      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);
      mockPrismaService.assignment.update.mockResolvedValue({
        ...mockAssignment,
        title: 'Updated Title',
      });

      const result = await service.updateAssignment(
        ASSIGNMENT_ID,
        INSTRUCTOR_ID,
        { title: 'Updated Title' },
        Role.INSTRUCTOR,
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should throw ForbiddenException if other instructor tries to update', async () => {
      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);

      await expect(
        service.updateAssignment(
          ASSIGNMENT_ID,
          OTHER_INSTRUCTOR_ID,
          { title: 'Hacked' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to update any assignment', async () => {
      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);
      mockPrismaService.assignment.update.mockResolvedValue(mockAssignment);

      const result = await service.updateAssignment(
        ASSIGNMENT_ID,
        'admin-1',
        { title: 'Updated' },
        Role.ADMIN,
      );

      expect(result).toBeDefined();
    });
  });

  /* ── deleteAssignment ─────────────────────────────────────── */
  describe('deleteAssignment', () => {
    it('should delete assignment for instructor', async () => {
      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);
      mockPrismaService.assignment.delete.mockResolvedValue(mockAssignment);

      const result = await service.deleteAssignment(
        ASSIGNMENT_ID,
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
      );

      expect(result).toEqual(mockAssignment);
      expect(mockPrismaService.assignment.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if other instructor tries to delete', async () => {
      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);

      await expect(
        service.deleteAssignment(
          ASSIGNMENT_ID,
          OTHER_INSTRUCTOR_ID,
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  /* ── submitAssignment ─────────────────────────────────────── */
  describe('submitAssignment', () => {
    it('should create submission for enrolled student', async () => {
      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);
      mockPrismaService.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
      });
      mockPrismaService.assignmentSubmission.findUnique.mockResolvedValue(null);
      mockPrismaService.assignmentSubmission.create.mockResolvedValue(
        mockSubmission,
      );

      const result = await service.submitAssignment(ASSIGNMENT_ID, STUDENT_ID, {
        submissionText: 'My work',
      });

      expect(result).toEqual(mockSubmission);
      expect(mockPrismaService.assignmentSubmission.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if student not enrolled', async () => {
      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.submitAssignment(ASSIGNMENT_ID, STUDENT_ID, {
          submissionText: 'Work',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update existing submission', async () => {
      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);
      mockPrismaService.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
      });
      mockPrismaService.assignmentSubmission.findUnique.mockResolvedValue(
        mockSubmission,
      );
      mockPrismaService.assignmentSubmission.update.mockResolvedValue({
        ...mockSubmission,
        submissionText: 'Updated work',
      });

      await service.submitAssignment(ASSIGNMENT_ID, STUDENT_ID, {
        submissionText: 'Updated work',
      });

      expect(mockPrismaService.assignmentSubmission.update).toHaveBeenCalled();
    });
  });

  /* ── getSubmissions ───────────────────────────────────────── */
  describe('getSubmissions', () => {
    it('should return all submissions for instructor assignment', async () => {
      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);
      mockPrismaService.assignmentSubmission.findMany.mockResolvedValue([
        mockSubmission,
      ]);

      const result = await service.getSubmissions(
        ASSIGNMENT_ID,
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
      );

      expect(result).toEqual([mockSubmission]);
    });

    it('should throw ForbiddenException if other instructor tries to view', async () => {
      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);

      await expect(
        service.getSubmissions(
          ASSIGNMENT_ID,
          OTHER_INSTRUCTOR_ID,
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to view any submissions', async () => {
      mockPrismaService.assignment.findUnique.mockResolvedValue(mockAssignment);
      mockPrismaService.assignmentSubmission.findMany.mockResolvedValue([
        mockSubmission,
      ]);

      const result = await service.getSubmissions(
        ASSIGNMENT_ID,
        'admin-1',
        Role.ADMIN,
      );

      expect(result).toEqual([mockSubmission]);
    });
  });

  /* ── gradeSubmission ──────────────────────────────────────── */
  describe('gradeSubmission', () => {
    it('should grade submission for instructor', async () => {
      mockPrismaService.assignmentSubmission.findUnique.mockResolvedValue({
        ...mockSubmission,
        assignment: mockAssignment,
      });
      mockPrismaService.assignmentSubmission.update.mockResolvedValue({
        ...mockSubmission,
        marks: 85,
        feedback: 'Good work',
        gradedAt: new Date(),
      });

      const result = await service.gradeSubmission(
        SUBMISSION_ID,
        INSTRUCTOR_ID,
        { marks: 85, feedback: 'Good work' },
        Role.INSTRUCTOR,
      );

      expect(result.marks).toBe(85);
      expect(result.feedback).toBe('Good work');
    });

    it('should throw ForbiddenException if other instructor tries to grade', async () => {
      mockPrismaService.assignmentSubmission.findUnique.mockResolvedValue({
        ...mockSubmission,
        assignment: mockAssignment,
      });

      await expect(
        service.gradeSubmission(
          SUBMISSION_ID,
          OTHER_INSTRUCTOR_ID,
          { marks: 85 },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
