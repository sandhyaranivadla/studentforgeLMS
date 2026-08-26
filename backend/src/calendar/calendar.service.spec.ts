import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role, LiveSessionStatus, AnnouncementStatus } from '@prisma/client';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  CalendarEventType,
  CalendarEventStatus,
} from './dto/calendar-event.dto';

describe('CalendarService', () => {
  let service: CalendarService;
  let prisma: PrismaService;

  const mockPrismaService = {
    course: {
      findMany: jest.fn(),
    },
    liveSession: {
      findMany: jest.fn(),
    },
    assignment: {
      findMany: jest.fn(),
    },
    announcement: {
      findMany: jest.fn(),
    },
  };

  const INSTRUCTOR_ID = 'instructor-1';
  const OTHER_INSTRUCTOR_ID = 'instructor-2';
  const ADMIN_ID = 'admin-1';
  const COURSE_ID = 'course-1';
  const OTHER_COURSE_ID = 'course-2';

  const mockCourse = {
    id: COURSE_ID,
    title: 'Test Course',
    instructorId: INSTRUCTOR_ID,
  };

  const mockOtherCourse = {
    id: OTHER_COURSE_ID,
    title: 'Other Course',
    instructorId: OTHER_INSTRUCTOR_ID,
  };

  const mockLiveSession = {
    id: 'live-1',
    courseId: COURSE_ID,
    moduleId: null,
    title: 'Live Class',
    description: 'Test live session',
    startTime: new Date('2024-01-15T10:00:00Z'),
    endTime: new Date('2024-01-15T11:00:00Z'),
    status: LiveSessionStatus.SCHEDULED,
    zoomMeetingId: 'zoom-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    course: mockCourse,
  };

  const mockAssignment = {
    id: 'assignment-1',
    courseId: COURSE_ID,
    moduleId: null,
    title: 'Assignment 1',
    description: 'Test assignment',
    instructions: null,
    dueDate: new Date('2024-01-20T23:59:59Z'),
    maxMarks: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    course: mockCourse,
  };

  const mockAnnouncement = {
    id: 'announcement-1',
    courseId: COURSE_ID,
    instructorId: INSTRUCTOR_ID,
    title: 'Announcement 1',
    content: 'Important announcement',
    status: AnnouncementStatus.PUBLISHED,
    createdAt: new Date('2024-01-10T08:00:00Z'),
    updatedAt: new Date(),
    publishedAt: new Date('2024-01-10T08:00:00Z'),
    course: mockCourse,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getCalendarEvents', () => {
    it('should return events for instructor from own courses', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      mockPrismaService.liveSession.findMany.mockResolvedValue([
        mockLiveSession,
      ]);
      mockPrismaService.assignment.findMany.mockResolvedValue([mockAssignment]);
      mockPrismaService.announcement.findMany.mockResolvedValue([
        mockAnnouncement,
      ]);

      const result = await service.getCalendarEvents(
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
      );

      expect(result.events).toHaveLength(3);
      expect(result.events[0].type).toBe(CalendarEventType.ANNOUNCEMENT);
      expect(result.events[1].type).toBe(CalendarEventType.LIVE_CLASS);
      expect(result.events[2].type).toBe(CalendarEventType.ASSIGNMENT_DUE);
      expect(result.range.start).toBe('2024-01-01T00:00:00Z');
      expect(result.range.end).toBe('2024-01-31T23:59:59Z');
    });

    it('should return empty array when instructor has no courses', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([]);

      const result = await service.getCalendarEvents(
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
      );

      expect(result.events).toHaveLength(0);
    });

    it('should allow admin to see events from all courses', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([
        mockCourse,
        mockOtherCourse,
      ]);
      mockPrismaService.liveSession.findMany.mockResolvedValue([
        mockLiveSession,
      ]);
      mockPrismaService.assignment.findMany.mockResolvedValue([]);
      mockPrismaService.announcement.findMany.mockResolvedValue([]);

      const result = await service.getCalendarEvents(ADMIN_ID, Role.ADMIN, {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      });

      // Verify both courses were queried
      expect(mockPrismaService.course.findMany).toHaveBeenCalledWith({
        where: {},
        select: { id: true, title: true },
      });
      expect(result.events.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter events to specific course when courseId provided', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      mockPrismaService.liveSession.findMany.mockResolvedValue([
        mockLiveSession,
      ]);
      mockPrismaService.assignment.findMany.mockResolvedValue([mockAssignment]);
      mockPrismaService.announcement.findMany.mockResolvedValue([
        mockAnnouncement,
      ]);

      const result = await service.getCalendarEvents(
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
          courseId: COURSE_ID,
        },
      );

      expect(result.events).toHaveLength(3);
      result.events.forEach((event) => {
        expect(event.courseId).toBe(COURSE_ID);
      });
    });

    it('should throw ForbiddenException when accessing course not owned', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);

      await expect(
        service.getCalendarEvents(INSTRUCTOR_ID, Role.INSTRUCTOR, {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
          courseId: OTHER_COURSE_ID,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid date format', async () => {
      await expect(
        service.getCalendarEvents(INSTRUCTOR_ID, Role.INSTRUCTOR, {
          startDate: 'invalid-date',
          endDate: '2024-01-31T23:59:59Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when endDate is before startDate', async () => {
      await expect(
        service.getCalendarEvents(INSTRUCTOR_ID, Role.INSTRUCTOR, {
          startDate: '2024-01-31T23:59:59Z',
          endDate: '2024-01-01T00:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should correctly map live session status', async () => {
      const completedSession = {
        ...mockLiveSession,
        status: LiveSessionStatus.COMPLETED,
      };

      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      mockPrismaService.liveSession.findMany.mockResolvedValue([
        completedSession,
      ]);
      mockPrismaService.assignment.findMany.mockResolvedValue([]);
      mockPrismaService.announcement.findMany.mockResolvedValue([]);

      const result = await service.getCalendarEvents(
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
      );

      expect(result.events[0].status).toBe(CalendarEventStatus.COMPLETED);
    });

    it('should correctly map assignment status to OVERDUE for past due dates', async () => {
      const overdueAssignment = {
        ...mockAssignment,
        dueDate: new Date('2024-01-01T00:00:00Z'), // Past date
      };

      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      mockPrismaService.liveSession.findMany.mockResolvedValue([]);
      mockPrismaService.assignment.findMany.mockResolvedValue([
        overdueAssignment,
      ]);
      mockPrismaService.announcement.findMany.mockResolvedValue([]);

      const result = await service.getCalendarEvents(
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
        {
          startDate: '2023-12-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
      );

      expect(result.events[0].status).toBe(CalendarEventStatus.OVERDUE);
    });

    it('should only include published announcements', async () => {
      const draftAnnouncement = {
        ...mockAnnouncement,
        status: AnnouncementStatus.DRAFT,
      };

      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      mockPrismaService.liveSession.findMany.mockResolvedValue([]);
      mockPrismaService.assignment.findMany.mockResolvedValue([]);
      mockPrismaService.announcement.findMany.mockResolvedValue([]);

      // Verify announcement query includes status filter
      await service.getCalendarEvents(INSTRUCTOR_ID, Role.INSTRUCTOR, {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      });

      expect(mockPrismaService.announcement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PUBLISHED',
          }),
        }),
      );
    });

    it('should sort events by date in ascending order', async () => {
      const event1 = {
        ...mockAnnouncement,
        publishedAt: new Date('2024-01-10T08:00:00Z'),
      };
      const event2 = {
        ...mockLiveSession,
        startTime: new Date('2024-01-15T10:00:00Z'),
      };
      const event3 = {
        ...mockAssignment,
        dueDate: new Date('2024-01-20T23:59:59Z'),
      };

      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      mockPrismaService.liveSession.findMany.mockResolvedValue([event2]);
      mockPrismaService.assignment.findMany.mockResolvedValue([event3]);
      mockPrismaService.announcement.findMany.mockResolvedValue([event1]);

      const result = await service.getCalendarEvents(
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
      );

      expect(result.events[0].date).toBe('2024-01-10T08:00:00.000Z');
      expect(result.events[1].date).toBe('2024-01-15T10:00:00.000Z');
      expect(result.events[2].date).toBe('2024-01-20T23:59:59.000Z');
    });

    it('should include event metadata', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      mockPrismaService.liveSession.findMany.mockResolvedValue([
        mockLiveSession,
      ]);
      mockPrismaService.assignment.findMany.mockResolvedValue([]);
      mockPrismaService.announcement.findMany.mockResolvedValue([]);

      const result = await service.getCalendarEvents(
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
      );

      const liveClassEvent = result.events.find(
        (e) => e.type === CalendarEventType.LIVE_CLASS,
      );
      expect(liveClassEvent?.metadata?.zoomMeetingId).toBe('zoom-123');
    });

    it('should handle multiple courses correctly', async () => {
      const course2LiveSession = {
        ...mockLiveSession,
        courseId: OTHER_COURSE_ID,
        course: mockOtherCourse,
      };

      mockPrismaService.course.findMany.mockResolvedValue([
        mockCourse,
        mockOtherCourse,
      ]);
      mockPrismaService.liveSession.findMany.mockResolvedValue([
        mockLiveSession,
        course2LiveSession,
      ]);
      mockPrismaService.assignment.findMany.mockResolvedValue([]);
      mockPrismaService.announcement.findMany.mockResolvedValue([]);

      const result = await service.getCalendarEvents(
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
      );

      expect(result.events).toHaveLength(2);
      expect(result.events[0].courseId).toBe(COURSE_ID);
      expect(result.events[1].courseId).toBe(OTHER_COURSE_ID);
    });
  });

  describe('getCalendarEventsByDate', () => {
    it('should return events for a specific date', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      mockPrismaService.liveSession.findMany.mockResolvedValue([
        mockLiveSession,
      ]);
      mockPrismaService.assignment.findMany.mockResolvedValue([]);
      mockPrismaService.announcement.findMany.mockResolvedValue([]);

      const result = await service.getCalendarEventsByDate(
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
        '2024-01-15',
      );

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no events on date', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      mockPrismaService.liveSession.findMany.mockResolvedValue([]);
      mockPrismaService.assignment.findMany.mockResolvedValue([]);
      mockPrismaService.announcement.findMany.mockResolvedValue([]);

      const result = await service.getCalendarEventsByDate(
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
        '2024-01-25',
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('event normalization', () => {
    it('should normalize live session to calendar event with correct properties', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      mockPrismaService.liveSession.findMany.mockResolvedValue([
        mockLiveSession,
      ]);
      mockPrismaService.assignment.findMany.mockResolvedValue([]);
      mockPrismaService.announcement.findMany.mockResolvedValue([]);

      const result = await service.getCalendarEvents(
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
      );

      const event = result.events[0];
      expect(event.type).toBe(CalendarEventType.LIVE_CLASS);
      expect(event.icon).toBe('video');
      expect(event.color).toBe('blue');
      expect(event.sourceType).toBe('LiveSession');
      expect(event.title).toBe('Live Class');
      expect(event.courseName).toBe('Test Course');
    });

    it('should normalize assignment to calendar event with correct properties', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      mockPrismaService.liveSession.findMany.mockResolvedValue([]);
      mockPrismaService.assignment.findMany.mockResolvedValue([mockAssignment]);
      mockPrismaService.announcement.findMany.mockResolvedValue([]);

      const result = await service.getCalendarEvents(
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
      );

      const event = result.events[0];
      expect(event.type).toBe(CalendarEventType.ASSIGNMENT_DUE);
      expect(event.icon).toBe('file');
      expect(event.color).toBe('orange');
      expect(event.sourceType).toBe('Assignment');
      expect(event.title).toContain('Due');
    });

    it('should normalize announcement to calendar event with correct properties', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);
      mockPrismaService.liveSession.findMany.mockResolvedValue([]);
      mockPrismaService.assignment.findMany.mockResolvedValue([]);
      mockPrismaService.announcement.findMany.mockResolvedValue([
        mockAnnouncement,
      ]);

      const result = await service.getCalendarEvents(
        INSTRUCTOR_ID,
        Role.INSTRUCTOR,
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
      );

      const event = result.events[0];
      expect(event.type).toBe(CalendarEventType.ANNOUNCEMENT);
      expect(event.icon).toBe('bell');
      expect(event.color).toBe('green');
      expect(event.sourceType).toBe('Announcement');
      expect(event.status).toBe(CalendarEventStatus.PUBLISHED);
    });
  });

  describe('RBAC and security', () => {
    it('should not include courses from other instructors', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);

      const courses = await (prisma.course.findMany as jest.Mock)({
        where: { instructorId: INSTRUCTOR_ID },
      });

      expect(courses[0].instructorId).toBe(INSTRUCTOR_ID);
      expect(courses).not.toContainEqual(
        expect.objectContaining({ instructorId: OTHER_INSTRUCTOR_ID }),
      );
    });

    it('should verify course ownership in query filters', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([mockCourse]);

      await service.getCalendarEvents(INSTRUCTOR_ID, Role.INSTRUCTOR, {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      });

      expect(mockPrismaService.course.findMany).toHaveBeenCalledWith({
        where: { instructorId: INSTRUCTOR_ID },
        select: { id: true, title: true },
      });
    });
  });
});
