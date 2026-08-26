import { IsString, IsISO8601, IsOptional, IsEnum } from 'class-validator';

export enum CalendarEventType {
  LIVE_CLASS = 'LIVE_CLASS',
  ASSIGNMENT_DUE = 'ASSIGNMENT_DUE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  QUIZ_ATTEMPT = 'QUIZ_ATTEMPT',
}

export enum CalendarEventStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
}

export class CalendarEventDto {
  @IsString()
  id!: string;

  @IsEnum(CalendarEventType)
  type!: CalendarEventType;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  courseId!: string;

  @IsString()
  courseName!: string;

  @IsISO8601()
  date!: string; // Primary event date (ISO 8601)

  @IsISO8601()
  @IsOptional()
  endDate?: string; // Optional end date for events with duration

  @IsEnum(CalendarEventStatus)
  status!: CalendarEventStatus;

  @IsString()
  icon!: string; // 'video', 'file', 'bell', 'clock', 'question'

  @IsString()
  color!: string; // 'blue', 'red', 'green', 'orange', 'purple', 'yellow'

  @IsString()
  sourceId!: string; // ID of source entity (liveSessionId, assignmentId, etc.)

  @IsString()
  sourceType!: string; // 'LiveSession', 'Assignment', 'Announcement'

  @IsOptional()
  metadata?: Record<string, any>;
}

export class CalendarEventsResponseDto {
  events!: CalendarEventDto[];

  range!: {
    start: string;
    end: string;
  };
}

export class CalendarQueryDto {
  @IsISO8601()
  startDate!: string;

  @IsISO8601()
  endDate!: string;

  @IsString()
  @IsOptional()
  courseId?: string; // Optional filter to single course
}
