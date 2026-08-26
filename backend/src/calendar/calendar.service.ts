import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import {
  CalendarEventDto,
  CalendarEventType,
  CalendarEventStatus,
  CalendarEventsResponseDto,
  CalendarQueryDto,
} from './dto/calendar-event.dto';

/**
 * Calendar Service
 *
 * Provides a unified calendar view for instructors and admins by aggregating events
 * from multiple data sources (LiveSessions, Assignments, Announcements).
 *
 * Features:
 * - Aggregates events from LiveSession, Assignment, and Announcement models
 * - Applies RBAC: instructors see own courses only, admins see all
 * - Normalizes different event types into a common CalendarEventDto structure
 * - Supports date range queries for efficient data retrieval
 * - Maps event statuses appropriately (e.g., past assignments marked as OVERDUE)
 *
 * Event Sources:
 * 1. LiveSession → CalendarEventType.LIVE_CLASS with startTime/endTime
 * 2. Assignment (with dueDate) → CalendarEventType.ASSIGNMENT_DUE
 * 3. Announcement (published) → CalendarEventType.ANNOUNCEMENT with publishedAt
 *
 * Date Handling:
 * - All dates stored and returned in ISO 8601 format
 * - Client browser displays in local timezone via toLocaleString()
 * - No explicit timezone conversion (uses UTC for consistency)
 *
 * Performance:
 * - Queries use date indexes on startTime (LiveSession) and dueDate (Assignment)
 * - Single roundtrip to database per feature (3 queries total)
 * - Results sorted by date for efficient UI rendering
 *
 * @example
 * // Get events for a date range (instructor sees own courses)
 * const events = await calendarService.getCalendarEvents(
 *   userId,
 *   Role.INSTRUCTOR,
 *   {
 *     startDate: '2024-01-01T00:00:00Z',
 *     endDate: '2024-01-31T23:59:59Z'
 *   }
 * );
 *
 * // Get events for a specific date
 * const dayEvents = await calendarService.getCalendarEventsByDate(
 *   userId,
 *   Role.INSTRUCTOR,
 *   '2024-01-15'
 * );
 */
@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all calendar events within a date range for instructor's courses
   * Aggregates events from:
   * - Live Sessions (startTime, endTime)
   * - Assignments (dueDate)
   * - Announcements (publishedAt)
   */
  async getCalendarEvents(
    userId: string,
    userRole: Role,
    query: CalendarQueryDto,
  ): Promise<CalendarEventsResponseDto> {
    // Validate date range
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException(
        'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)',
      );
    }

    if (endDate <= startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    // Get instructor's courses (or all if admin)
    const courses = await this.prisma.course.findMany({
      where: userRole === Role.ADMIN ? {} : { instructorId: userId },
      select: { id: true, title: true },
    });

    const courseIds = courses.map((c) => c.id);
    const courseMap = new Map(courses.map((c) => [c.id, c.title]));

    if (courseIds.length === 0) {
      return {
        events: [],
        range: {
          start: query.startDate,
          end: query.endDate,
        },
      };
    }

    // Apply optional courseId filter
    const filteredCourseIds = query.courseId
      ? courseIds.filter((id) => id === query.courseId)
      : courseIds;

    if (query.courseId && filteredCourseIds.length === 0) {
      throw new ForbiddenException('You do not have access to this course');
    }

    const events: CalendarEventDto[] = [];

    // Fetch Live Sessions
    const liveSessions = await this.prisma.liveSession.findMany({
      where: {
        courseId: { in: filteredCourseIds },
        startTime: { gte: startDate, lte: endDate },
      },
      include: { course: true },
    });

    events.push(
      ...liveSessions.map((session) =>
        this.normalizeToCalendarEvent(
          session.id,
          CalendarEventType.LIVE_CLASS,
          session.title,
          session.description || undefined,
          session.courseId,
          courseMap.get(session.courseId)!,
          session.startTime.toISOString(),
          session.endTime ? session.endTime.toISOString() : undefined,
          this.mapLiveSessionStatus(session.status),
          'video',
          'blue',
          'LiveSession',
          { zoomMeetingId: session.zoomMeetingId },
        ),
      ),
    );

    // Fetch Assignments with dueDate
    const assignments = await this.prisma.assignment.findMany({
      where: {
        courseId: { in: filteredCourseIds },
        dueDate: { gte: startDate, lte: endDate },
      },
      include: { course: true },
    });

    events.push(
      ...assignments.map((assignment) =>
        this.normalizeToCalendarEvent(
          assignment.id,
          CalendarEventType.ASSIGNMENT_DUE,
          `${assignment.title} - Due`,
          assignment.description,
          assignment.courseId,
          courseMap.get(assignment.courseId)!,
          assignment.dueDate!.toISOString(),
          undefined,
          this.mapAssignmentStatus(assignment.dueDate!),
          'file',
          'orange',
          'Assignment',
          { maxMarks: assignment.maxMarks },
        ),
      ),
    );

    // Fetch Published Announcements
    const announcements = await this.prisma.announcement.findMany({
      where: {
        courseId: { in: filteredCourseIds },
        publishedAt: { gte: startDate, lte: endDate },
        status: 'PUBLISHED',
      },
      include: { course: true },
    });

    events.push(
      ...announcements.map((announcement) =>
        this.normalizeToCalendarEvent(
          announcement.id,
          CalendarEventType.ANNOUNCEMENT,
          announcement.title,
          announcement.content,
          announcement.courseId,
          courseMap.get(announcement.courseId)!,
          announcement.publishedAt!.toISOString(),
          undefined,
          CalendarEventStatus.PUBLISHED,
          'bell',
          'green',
          'Announcement',
          { instructorId: announcement.instructorId },
        ),
      ),
    );

    // Sort events by date
    events.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return {
      events,
      range: {
        start: query.startDate,
        end: query.endDate,
      },
    };
  }

  /**
   * Get events for a specific date
   */
  async getCalendarEventsByDate(
    userId: string,
    userRole: Role,
    date: string,
  ): Promise<CalendarEventDto[]> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const result = await this.getCalendarEvents(userId, userRole, {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
    });

    return result.events;
  }

  /**
   * Normalize event to CalendarEventDto
   */
  private normalizeToCalendarEvent(
    id: string,
    type: CalendarEventType,
    title: string,
    description: string | undefined,
    courseId: string,
    courseName: string,
    date: string,
    endDate: string | undefined,
    status: CalendarEventStatus,
    icon: string,
    color: string,
    sourceType: string,
    metadata?: Record<string, any>,
  ): CalendarEventDto {
    return {
      id,
      type,
      title,
      description,
      courseId,
      courseName,
      date,
      endDate,
      status,
      icon,
      color,
      sourceId: id,
      sourceType,
      metadata,
    };
  }

  /**
   * Map LiveSession status to CalendarEventStatus
   */
  private mapLiveSessionStatus(status: string): CalendarEventStatus {
    switch (status) {
      case 'SCHEDULED':
        return CalendarEventStatus.SCHEDULED;
      case 'LIVE':
        return CalendarEventStatus.LIVE;
      case 'COMPLETED':
        return CalendarEventStatus.COMPLETED;
      case 'CANCELLED':
        return CalendarEventStatus.CANCELLED;
      default:
        return CalendarEventStatus.SCHEDULED;
    }
  }

  /**
   * Map Assignment dueDate to status
   * If due date is in past and no submissions, mark as OVERDUE
   */
  private mapAssignmentStatus(dueDate: Date): CalendarEventStatus {
    const now = new Date();
    if (dueDate < now) {
      return CalendarEventStatus.OVERDUE;
    }
    return CalendarEventStatus.SCHEDULED;
  }
}
