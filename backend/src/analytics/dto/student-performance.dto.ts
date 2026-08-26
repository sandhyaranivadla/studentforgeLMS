export class StudentPerformanceDto {
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrollmentDate: Date;
  enrollmentStatus: string;
  progress: number; // 0-100

  // Lesson analytics
  lessonsCompleted: number;
  lessonsTotal: number;
  lessonsCompletionRate: number; // 0-100

  // Assignment analytics
  assignmentsSubmitted: number;
  assignmentsTotal: number;
  assignmentSubmissionRate: number; // 0-100
  assignmentAverageScore: number;
  assignmentAverageMaxScore: number;

  // Quiz analytics
  quizzesTaken: number;
  quizzesTotal: number;
  quizPassedCount: number;
  quizPassRate: number; // 0-100
  quizAverageScore: number;

  // Live session attendance
  liveSessionsAttended: number;
  liveSessionsTotal: number;
  attendanceRate: number; // 0-100

  // Last activity
  lastActivityAt: Date;
}
