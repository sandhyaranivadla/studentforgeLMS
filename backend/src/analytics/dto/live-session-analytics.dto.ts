export class LiveSessionAnalyticsDto {
  sessionId: string;
  title: string;
  description: string | null;
  moduleId: string | null;
  moduleName: string;

  // Scheduling
  startTime: Date;
  endTime: Date | null;
  status: string; // SCHEDULED, LIVE, COMPLETED, CANCELLED

  // Attendance (will be enhanced when attendance model is added)
  estimatedAttendees: number; // based on enrollments
  scheduledCount: number; // students who enrolled before session

  // Session info
  zoomMeetingId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
