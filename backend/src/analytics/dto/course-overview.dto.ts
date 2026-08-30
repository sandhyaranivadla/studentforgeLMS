export class CourseOverviewDto {
  enrollmentCount: number;
  activeEnrollments: number;
  completedEnrollments: number;
  cancelledEnrollments: number;
  averageCompletion: number; // 0-100
  assignmentSubmissionRate: number; // 0-100
  quizPassRate: number; // 0-100
  lessonsTotal: number;
  lessonsAverageCompletion: number;
  assignmentsTotal: number;
  quizzesTotal: number;
  liveSessionsTotal: number;
  liveSessionsUpcoming: number;
}
