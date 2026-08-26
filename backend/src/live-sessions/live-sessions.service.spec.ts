import { Test, TestingModule } from '@nestjs/testing';
import { LiveSessionsService } from './live-sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ZoomService } from './zoom.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Role, LiveSessionStatus } from '@prisma/client';

describe('LiveSessionsService', () => {
  let service: LiveSessionsService;

  const mockPrisma = {
    course: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    courseModule: {
      findUnique: jest.fn(),
    },
    liveSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockZoom = {
    createMeeting: jest.fn(),
    getMeeting: jest.fn(),
    deleteMeeting: jest.fn(),
    isConfigured: jest.fn(),
    getOAuthUrl: jest.fn(),
  };

  const mockCourse = {
    id: 'course-1',
    title: 'Test Course',
    instructorId: 'instructor-1',
  };

  const mockLiveSession = {
    id: 'session-1',
    courseId: 'course-1',
    moduleId: null,
    title: 'Test Session',
    description: 'Test Description',
    startTime: new Date('2026-09-01T10:00:00Z'),
    endTime: new Date('2026-09-01T11:00:00Z'),
    status: LiveSessionStatus.SCHEDULED,
    zoomMeetingId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    course: mockCourse,
    module: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveSessionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ZoomService, useValue: mockZoom },
      ],
    }).compile();

    service = module.get<LiveSessionsService>(LiveSessionsService);
    jest.clearAllMocks();
  });

  describe('createLiveSession', () => {
    it('should create a live session for an instructor', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.liveSession.create.mockResolvedValue(mockLiveSession);

      const dto = {
        title: 'Test Session',
        description: 'Test Description',
        startTime: '2026-09-01T10:00:00Z',
        endTime: '2026-09-01T11:00:00Z',
      };

      const result = await service.createLiveSession(
        'course-1',
        'instructor-1',
        dto,
        Role.INSTRUCTOR,
      );

      expect(result).toEqual(mockLiveSession);
    });

    it('should throw if course not found', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(
        service.createLiveSession(
          'course-1',
          'instructor-1',
          {
            title: 'Test',
            startTime: '2026-09-01T10:00:00Z',
          },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if instructor does not own the course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);

      await expect(
        service.createLiveSession(
          'course-1',
          'different-instructor',
          {
            title: 'Test',
            startTime: '2026-09-01T10:00:00Z',
          },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to create session for any course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.liveSession.create.mockResolvedValue(mockLiveSession);

      const result = await service.createLiveSession(
        'course-1',
        'admin-user',
        {
          title: 'Test',
          startTime: '2026-09-01T10:00:00Z',
        },
        Role.ADMIN,
      );

      expect(result).toEqual(mockLiveSession);
    });

    it('should validate endTime is after startTime', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);

      await expect(
        service.createLiveSession(
          'course-1',
          'instructor-1',
          {
            title: 'Test',
            startTime: '2026-09-01T11:00:00Z',
            endTime: '2026-09-01T10:00:00Z',
          },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate module belongs to course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.courseModule.findUnique.mockResolvedValue(null);

      await expect(
        service.createLiveSession(
          'course-1',
          'instructor-1',
          {
            title: 'Test',
            startTime: '2026-09-01T10:00:00Z',
            moduleId: 'wrong-module',
          },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw on invalid date format', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);

      await expect(
        service.createLiveSession(
          'course-1',
          'instructor-1',
          {
            title: 'Test',
            startTime: 'invalid-date',
          },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllByCourse', () => {
    it('should find all sessions for a course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.liveSession.findMany.mockResolvedValue([mockLiveSession]);

      const result = await service.findAllByCourse(
        'course-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result).toEqual([mockLiveSession]);
    });

    it('should throw if instructor does not own course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);

      await expect(
        service.findAllByCourse(
          'course-1',
          'different-instructor',
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findUpcoming', () => {
    it('should find upcoming sessions for instructor', async () => {
      mockPrisma.course.findMany.mockResolvedValue([{ id: 'course-1' }]);
      mockPrisma.liveSession.findMany.mockResolvedValue([mockLiveSession]);

      const result = await service.findUpcoming(
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result).toEqual([mockLiveSession]);
    });

    it('should return empty array if instructor has no courses', async () => {
      mockPrisma.course.findMany.mockResolvedValue([]);

      const result = await service.findUpcoming(
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result).toEqual([]);
    });

    it('should allow admin to see all upcoming sessions', async () => {
      mockPrisma.course.findMany.mockResolvedValue([
        { id: 'course-1' },
        { id: 'course-2' },
      ]);
      mockPrisma.liveSession.findMany.mockResolvedValue([mockLiveSession]);

      const result = await service.findUpcoming('admin-user', Role.ADMIN);

      expect(result).toEqual([mockLiveSession]);
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: {},
        select: { id: true },
      });
    });
  });

  describe('findPast', () => {
    it('should find past sessions for instructor', async () => {
      mockPrisma.course.findMany.mockResolvedValue([{ id: 'course-1' }]);
      mockPrisma.liveSession.findMany.mockResolvedValue([mockLiveSession]);

      const result = await service.findPast('instructor-1', Role.INSTRUCTOR);

      expect(result).toEqual([mockLiveSession]);
    });
  });

  describe('findOne', () => {
    it('should find a session by id', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(mockLiveSession);

      const result = await service.findOne(
        'session-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result).toEqual(mockLiveSession);
    });

    it('should throw if session not found', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('session-1', 'instructor-1', Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if instructor does not own session', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(mockLiveSession);

      await expect(
        service.findOne('session-1', 'different-instructor', Role.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to view any session', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(mockLiveSession);

      const result = await service.findOne(
        'session-1',
        'admin-user',
        Role.ADMIN,
      );

      expect(result).toEqual(mockLiveSession);
    });
  });

  describe('updateLiveSession', () => {
    it('should update a session', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(mockLiveSession);
      mockPrisma.liveSession.update.mockResolvedValue({
        ...mockLiveSession,
        title: 'Updated Title',
      });

      const result = await service.updateLiveSession(
        'session-1',
        'instructor-1',
        { title: 'Updated Title' },
        Role.INSTRUCTOR,
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should only allow updating SCHEDULED sessions', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue({
        ...mockLiveSession,
        status: LiveSessionStatus.LIVE,
      });

      await expect(
        service.updateLiveSession(
          'session-1',
          'instructor-1',
          { title: 'New' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if instructor does not own session', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(mockLiveSession);

      await expect(
        service.updateLiveSession(
          'session-1',
          'different-instructor',
          { title: 'New' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteLiveSession', () => {
    it('should delete a session', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(mockLiveSession);
      mockPrisma.liveSession.delete.mockResolvedValue(mockLiveSession);

      const result = await service.deleteLiveSession(
        'session-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result).toEqual(mockLiveSession);
    });

    it('should throw if instructor does not own session', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(mockLiveSession);

      await expect(
        service.deleteLiveSession(
          'session-1',
          'different-instructor',
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should not allow deleting LIVE or COMPLETED sessions', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue({
        ...mockLiveSession,
        status: LiveSessionStatus.LIVE,
      });

      await expect(
        service.deleteLiveSession('session-1', 'instructor-1', Role.INSTRUCTOR),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should transition from SCHEDULED to LIVE', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(mockLiveSession);
      mockPrisma.liveSession.update.mockResolvedValue({
        ...mockLiveSession,
        status: LiveSessionStatus.LIVE,
      });

      const result = await service.updateStatus(
        'session-1',
        'instructor-1',
        { status: LiveSessionStatus.LIVE },
        Role.INSTRUCTOR,
      );

      expect(result.status).toBe(LiveSessionStatus.LIVE);
    });

    it('should transition from LIVE to COMPLETED', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue({
        ...mockLiveSession,
        status: LiveSessionStatus.LIVE,
      });
      mockPrisma.liveSession.update.mockResolvedValue({
        ...mockLiveSession,
        status: LiveSessionStatus.COMPLETED,
      });

      const result = await service.updateStatus(
        'session-1',
        'instructor-1',
        { status: LiveSessionStatus.COMPLETED },
        Role.INSTRUCTOR,
      );

      expect(result.status).toBe(LiveSessionStatus.COMPLETED);
    });

    it('should not allow invalid transitions', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue({
        ...mockLiveSession,
        status: LiveSessionStatus.COMPLETED,
      });

      await expect(
        service.updateStatus(
          'session-1',
          'instructor-1',
          { status: LiveSessionStatus.LIVE },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if instructor does not own session', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(mockLiveSession);

      await expect(
        service.updateStatus(
          'session-1',
          'different-instructor',
          { status: LiveSessionStatus.LIVE },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('setZoomLink', () => {
    it('should set zoom meeting id', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(mockLiveSession);
      mockPrisma.liveSession.update.mockResolvedValue({
        ...mockLiveSession,
        zoomMeetingId: '123456789',
      });

      const result = await service.setZoomLink(
        'session-1',
        'instructor-1',
        '123456789',
        Role.INSTRUCTOR,
      );

      expect(result.zoomMeetingId).toBe('123456789');
    });

    it('should throw if zoom id is empty', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(mockLiveSession);

      await expect(
        service.setZoomLink('session-1', 'instructor-1', '', Role.INSTRUCTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if instructor does not own session', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(mockLiveSession);

      await expect(
        service.setZoomLink(
          'session-1',
          'different-instructor',
          '123456789',
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Cross-instructor Security', () => {
    it('should prevent instructor A from modifying instructor B session', async () => {
      const courseB = { id: 'course-2', instructorId: 'instructor-2' };
      const sessionB = {
        ...mockLiveSession,
        courseId: 'course-2',
        course: courseB,
      };

      mockPrisma.liveSession.findUnique.mockResolvedValue(sessionB);

      await expect(
        service.updateLiveSession(
          'session-1',
          'instructor-1',
          { title: 'Hacked' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent instructor A from deleting instructor B session', async () => {
      const courseB = { id: 'course-2', instructorId: 'instructor-2' };
      const sessionB = {
        ...mockLiveSession,
        courseId: 'course-2',
        course: courseB,
      };

      mockPrisma.liveSession.findUnique.mockResolvedValue(sessionB);

      await expect(
        service.deleteLiveSession('session-1', 'instructor-1', Role.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to modify any session', async () => {
      const courseB = { id: 'course-2', instructorId: 'instructor-2' };
      const sessionB = {
        ...mockLiveSession,
        courseId: 'course-2',
        course: courseB,
      };

      mockPrisma.liveSession.findUnique.mockResolvedValue(sessionB);
      mockPrisma.liveSession.update.mockResolvedValue({
        ...sessionB,
        title: 'Updated',
      });

      const result = await service.updateLiveSession(
        'session-1',
        'admin-user',
        { title: 'Updated' },
        Role.ADMIN,
      );

      expect(result.title).toBe('Updated');
    });
  });
});
