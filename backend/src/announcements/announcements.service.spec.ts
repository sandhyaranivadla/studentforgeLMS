import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementsService } from './announcements.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role, AnnouncementStatus } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  course: {
    findUnique: jest.fn(),
  },
  enrollment: {
    findFirst: jest.fn(),
  },
  announcement: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const INSTRUCTOR_ID = 'instructor-1';
const OTHER_INSTRUCTOR_ID = 'instructor-2';
const STUDENT_ID = 'student-1';
const COURSE_ID = 'course-1';
const ANNOUNCEMENT_ID = 'announcement-1';

const mockCourse = {
  id: COURSE_ID,
  title: 'Test Course',
  instructorId: INSTRUCTOR_ID,
  published: true,
};

const mockAnnouncement = {
  id: ANNOUNCEMENT_ID,
  courseId: COURSE_ID,
  instructorId: INSTRUCTOR_ID,
  title: 'Test Announcement',
  content: 'This is a test announcement',
  status: AnnouncementStatus.DRAFT,
  createdAt: new Date(),
  updatedAt: new Date(),
  publishedAt: null,
};

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnnouncementsService>(AnnouncementsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create announcement for instructor own course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.announcement.create.mockResolvedValue({
        ...mockAnnouncement,
        course: { title: mockCourse.title },
        instructor: {
          id: INSTRUCTOR_ID,
          name: 'Test Instructor',
          email: 'instructor@test.com',
        },
      });

      const result = await service.create(
        COURSE_ID,
        INSTRUCTOR_ID,
        {
          courseId: COURSE_ID,
          title: 'Test Announcement',
          content: 'This is a test announcement',
        },
        Role.INSTRUCTOR,
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('Test Announcement');
    });

    it('should throw ForbiddenException for other instructor course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      await expect(
        service.create(
          COURSE_ID,
          OTHER_INSTRUCTOR_ID,
          {
            courseId: COURSE_ID,
            title: 'Test',
            content: 'Test content',
          },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to create for any course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.announcement.create.mockResolvedValue({
        ...mockAnnouncement,
        instructorId: 'admin-id',
      });

      const result = await service.create(
        COURSE_ID,
        'admin-id',
        {
          courseId: COURSE_ID,
          title: 'Admin Announcement',
          content: 'Created by admin',
        },
        Role.ADMIN,
      );

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for non-existent course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          'non-existent',
          INSTRUCTOR_ID,
          { courseId: 'non-existent', title: 'Test', content: 'Test' },
          Role.ADMIN,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByCourse', () => {
    it('should return all announcements for instructor own course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.announcement.findMany.mockResolvedValue([
        { ...mockAnnouncement, status: AnnouncementStatus.DRAFT },
        { ...mockAnnouncement, status: AnnouncementStatus.PUBLISHED },
      ]);

      const result = await service.findAllByCourse(
        COURSE_ID,
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should throw ForbiddenException for other instructor course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      await expect(
        service.findAllByCourse(
          COURSE_ID,
          OTHER_INSTRUCTOR_ID,
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to view any course announcements', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.announcement.findMany.mockResolvedValue([
        mockAnnouncement,
      ]);

      const result = await service.findAllByCourse(
        COURSE_ID,
        'admin-id',
        Role.ADMIN,
      );

      expect(result).toBeDefined();
    });
  });

  describe('findPublishedByCourse', () => {
    it('should return published announcements for enrolled student', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        studentId: STUDENT_ID,
        courseId: COURSE_ID,
      });
      mockPrismaService.announcement.findMany.mockResolvedValue([
        {
          ...mockAnnouncement,
          status: AnnouncementStatus.PUBLISHED,
        },
      ]);

      const result = await service.findPublishedByCourse(
        COURSE_ID,
        STUDENT_ID,
        Role.STUDENT,
      );

      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw ForbiddenException for non-enrolled student', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.findPublishedByCourse(COURSE_ID, STUDENT_ID, Role.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent course', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);

      await expect(
        service.findPublishedByCourse('non-existent', STUDENT_ID, Role.STUDENT),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return announcement for instructor owner', async () => {
      mockPrismaService.announcement.findUnique.mockResolvedValue({
        ...mockAnnouncement,
        course: { id: COURSE_ID, title: mockCourse.title },
        instructor: {
          id: INSTRUCTOR_ID,
          name: 'Test',
          email: 'test@test.com',
        },
      });

      const result = await service.findOne(
        ANNOUNCEMENT_ID,
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('Test Announcement');
    });

    it('should throw ForbiddenException for other instructor', async () => {
      mockPrismaService.announcement.findUnique.mockResolvedValue({
        ...mockAnnouncement,
        instructor: {
          id: INSTRUCTOR_ID,
          name: 'Other',
          email: 'other@test.com',
        },
      });

      await expect(
        service.findOne(ANNOUNCEMENT_ID, OTHER_INSTRUCTOR_ID, Role.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent announcement', async () => {
      mockPrismaService.announcement.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent', INSTRUCTOR_ID, Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for student viewing draft', async () => {
      mockPrismaService.announcement.findUnique.mockResolvedValue({
        ...mockAnnouncement,
        status: AnnouncementStatus.DRAFT,
      });

      await expect(
        service.findOne(ANNOUNCEMENT_ID, STUDENT_ID, Role.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update announcement for instructor owner', async () => {
      mockPrismaService.announcement.findUnique.mockResolvedValue(
        mockAnnouncement,
      );
      mockPrismaService.announcement.update.mockResolvedValue({
        ...mockAnnouncement,
        title: 'Updated Title',
      });

      const result = await service.update(
        ANNOUNCEMENT_ID,
        INSTRUCTOR_ID,
        { title: 'Updated Title' },
        Role.INSTRUCTOR,
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should throw ForbiddenException for other instructor', async () => {
      mockPrismaService.announcement.findUnique.mockResolvedValue(
        mockAnnouncement,
      );

      await expect(
        service.update(
          ANNOUNCEMENT_ID,
          OTHER_INSTRUCTOR_ID,
          { title: 'Updated' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should set publishedAt when transitioning to PUBLISHED', async () => {
      mockPrismaService.announcement.findUnique.mockResolvedValue({
        ...mockAnnouncement,
        status: AnnouncementStatus.DRAFT,
        publishedAt: null,
      });
      mockPrismaService.announcement.update.mockResolvedValue({
        ...mockAnnouncement,
        status: AnnouncementStatus.PUBLISHED,
        publishedAt: new Date(),
      });

      const result = await service.update(
        ANNOUNCEMENT_ID,
        INSTRUCTOR_ID,
        { status: AnnouncementStatus.PUBLISHED },
        Role.INSTRUCTOR,
      );

      expect(result.status).toBe(AnnouncementStatus.PUBLISHED);
      expect(result.publishedAt).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete announcement for instructor owner', async () => {
      mockPrismaService.announcement.findUnique.mockResolvedValue(
        mockAnnouncement,
      );
      mockPrismaService.announcement.delete.mockResolvedValue(mockAnnouncement);

      const result = await service.delete(
        ANNOUNCEMENT_ID,
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
      );

      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException for other instructor', async () => {
      mockPrismaService.announcement.findUnique.mockResolvedValue(
        mockAnnouncement,
      );

      await expect(
        service.delete(ANNOUNCEMENT_ID, OTHER_INSTRUCTOR_ID, Role.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent announcement', async () => {
      mockPrismaService.announcement.findUnique.mockResolvedValue(null);

      await expect(
        service.delete('non-existent', INSTRUCTOR_ID, Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
