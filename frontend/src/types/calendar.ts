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

export interface CalendarEventDto {
  id: string;
  type: CalendarEventType | string;
  title: string;
  description?: string;
  courseId: string;
  courseName: string;
  date: string; // ISO 8601
  endDate?: string; // ISO 8601
  status: CalendarEventStatus | string;
  icon: string;
  color: string;
  sourceId: string;
  sourceType: string;
  metadata?: Record<string, any>;
}

export interface CalendarEventsResponse {
  events: CalendarEventDto[];
  range: {
    start: string;
    end: string;
  };
}
