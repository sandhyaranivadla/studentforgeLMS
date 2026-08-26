export class AssignmentAnalyticsDto {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: Date | null;
  maxMarks: number;

  // Submission stats
  submittedCount: number;
  totalEnrolled: number;
  submissionRate: number; // 0-100
  notSubmittedCount: number;

  // Grading stats
  gradedCount: number;
  pendingGradingCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;

  // Deadline stats
  onTimeSubmissions: number;
  lateSubmissions: number;
  deadlineMissRate: number; // 0-100

  // Last updated
  updatedAt: Date;
}
