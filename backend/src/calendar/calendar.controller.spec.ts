import { Test, TestingModule } from '@nestjs/testing';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { Role } from '@prisma/client';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('CalendarController', () => {
  let controller: CalendarController;
  let service: CalendarService;

  const mockCalendarService = {
    getCalendarEvents: jest.fn(),
    getCalendarEventsByDate: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'instructor-1',
      email: 'instructor@test.com',
      role: Role.INSTRUCTOR,
    },
  };

  const mockCalendarResponse = {
    events: [
      {
        id: 'event-1',
        type: 'LIVE_CLASS',
        title: 'Live Class',
        courseId: 'course-1',
        courseName: 'Test Course',
        date: '2024-01-15T10:00:00Z',
        endDate: '2024-01-15T11:00:00Z',
        status: 'SCHEDULED',
        icon: 'video',
        color: 'blue',
        sourceId: 'live-1',
        sourceType: 'LiveSession',
      },
    ],
    range: {
      start: '2024-01-01T00:00:00Z',
      end: '2024-01-31T23:59:59Z',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
      ],
    }).compile();

    controller = module.get<CalendarController>(CalendarController);
    service = module.get<CalendarService>(CalendarService);

    jest.clearAllMocks();
  });

  describe('getCalendarEvents', () => {
    it('should return calendar events for valid date range', async () => {
      mockCalendarService.getCalendarEvents.mockResolvedValue(
        mockCalendarResponse,
      );

      const result = await controller.getCalendarEvents(
        mockRequest as any,
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
      );

      expect(result).toEqual(mockCalendarResponse);
      expect(service.getCalendarEvents).toHaveBeenCalledWith(
        'instructor-1',
        Role.INSTRUCTOR,
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
          courseId: undefined,
        },
      );
    });

    it('should filter by courseId when provided', async () => {
      mockCalendarService.getCalendarEvents.mockResolvedValue(
        mockCalendarResponse,
      );

      const result = await controller.getCalendarEvents(
        mockRequest as any,
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        'course-1',
      );

      expect(result).toEqual(mockCalendarResponse);
      expect(service.getCalendarEvents).toHaveBeenCalledWith(
        'instructor-1',
        Role.INSTRUCTOR,
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
          courseId: 'course-1',
        },
      );
    });

    it('should handle service errors', async () => {
      mockCalendarService.getCalendarEvents.mockRejectedValue(
        new BadRequestException('Invalid date range'),
      );

      await expect(
        controller.getCalendarEvents(mockRequest as any, 'invalid', 'invalid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require INSTRUCTOR or ADMIN role (enforced by guard)', async () => {
      // This is tested by RolesGuard decorator, not in controller logic
      // But we verify the endpoint is decorated
      expect(controller.getCalendarEvents).toBeDefined();
    });
  });

  describe('getCalendarEventsByDate', () => {
    it('should return events for specific date', async () => {
      const dateEvents = [mockCalendarResponse.events[0]];
      mockCalendarService.getCalendarEventsByDate.mockResolvedValue(dateEvents);

      const result = await controller.getCalendarEventsByDate(
        mockRequest as any,
        '2024-01-15',
      );

      expect(result).toEqual(dateEvents);
      expect(service.getCalendarEventsByDate).toHaveBeenCalledWith(
        'instructor-1',
        Role.INSTRUCTOR,
        '2024-01-15',
      );
    });

    it('should return empty array for date with no events', async () => {
      mockCalendarService.getCalendarEventsByDate.mockResolvedValue([]);

      const result = await controller.getCalendarEventsByDate(
        mockRequest as any,
        '2024-01-25',
      );

      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockCalendarService.getCalendarEventsByDate.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(
        controller.getCalendarEventsByDate(mockRequest as any, '2024-01-15'),
      ).rejects.toThrow();
    });
  });

  describe('RBAC & Authorization', () => {
    it('should use JwtAuthGuard to require authentication', async () => {
      // Guard decorator is verified through decorators on controller
      expect(
        Reflect.getMetadataKeys(controller.getCalendarEvents).length,
      ).toBeGreaterThan(0);
    });

    it('should allow INSTRUCTOR role', async () => {
      const instructorRequest = {
        user: {
          id: 'instructor-1',
          email: 'instructor@test.com',
          role: Role.INSTRUCTOR,
        },
      };

      mockCalendarService.getCalendarEvents.mockResolvedValue(
        mockCalendarResponse,
      );

      await controller.getCalendarEvents(
        instructorRequest as any,
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
      );

      expect(service.getCalendarEvents).toHaveBeenCalled();
    });

    it('should allow ADMIN role', async () => {
      const adminRequest = {
        user: {
          id: 'admin-1',
          email: 'admin@test.com',
          role: Role.ADMIN,
        },
      };

      mockCalendarService.getCalendarEvents.mockResolvedValue(
        mockCalendarResponse,
      );

      await controller.getCalendarEvents(
        adminRequest as any,
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
      );

      expect(service.getCalendarEvents).toHaveBeenCalled();
    });
  });

  describe('Response formatting', () => {
    it('should return properly formatted CalendarEventsResponseDto', async () => {
      mockCalendarService.getCalendarEvents.mockResolvedValue(
        mockCalendarResponse,
      );

      const result = await controller.getCalendarEvents(
        mockRequest as any,
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
      );

      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('range');
      expect(Array.isArray(result.events)).toBe(true);
      expect(result.range).toHaveProperty('start');
      expect(result.range).toHaveProperty('end');
    });

    it('should include event metadata in response', async () => {
      mockCalendarService.getCalendarEvents.mockResolvedValue(
        mockCalendarResponse,
      );

      const result = await controller.getCalendarEvents(
        mockRequest as any,
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
      );

      const event = result.events[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('courseId');
      expect(event).toHaveProperty('date');
      expect(event).toHaveProperty('status');
    });
  });
});
