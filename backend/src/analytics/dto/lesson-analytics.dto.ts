export class LessonAnalyticsDto {
  lessonId: string;
  title: string;
  type: string;
  moduleId: string;
  moduleName: string;

  // Access and completion
  viewCount: number;
  uniqueStudentsViewed: number;
  uniqueStudentsCompleted: number;
  totalEnrolled: number;
  completionRate: number; // 0-100
  viewRate: number; // 0-100

  // Time tracking
  averageTimeSpent: number; // in seconds
  averageLastAccess: Date;

  // Status
  orderIndex: number;
  createdAt: Date;
}
