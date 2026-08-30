export class QuizAnalyticsDto {
  quizId: string;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimit: number; // in seconds
  totalQuestions: number;
  totalMarks: number;

  // Attempt stats
  attemptCount: number;
  uniqueStudentsAttempted: number;
  totalEnrolled: number;
  attemptRate: number; // 0-100

  // Score stats
  averageScore: number;
  highestScore: number;
  lowestScore: number;

  // Pass rate
  passedCount: number;
  failedCount: number;
  passRate: number; // 0-100

  // Time spent
  averageTimeSpent: number; // in seconds

  // Published status
  published: boolean;
  updatedAt: Date;
}
