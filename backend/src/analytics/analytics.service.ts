import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CourseOverviewDto } from './dto/course-overview.dto';
import { StudentPerformanceDto } from './dto/student-performance.dto';
import { AssignmentAnalyticsDto } from './dto/assignment-analytics.dto';
import { QuizAnalyticsDto } from './dto/quiz-analytics.dto';
import { LessonAnalyticsDto } from './dto/lesson-analytics.dto';
import { LiveSessionAnalyticsDto } from './dto/live-session-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verify instructor owns the course or is admin
   */
  private async verifyCourseOwnership(
    courseId: string,
    instructorId: string,
    role: Role,
  ): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (role !== Role.ADMIN && course.instructorId !== instructorId) {
      throw new ForbiddenException('You do not have access to this course');
    }
  }

  /**
   * GET /analytics/courses/:courseId/overview
   * Returns course health snapshot
   */
  async getCourseOverview(
    courseId: string,
    instructorId: string,
    role: Role,
  ): Promise<CourseOverviewDto> {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Instructors can only see their own courses - return empty if not owner
    if (role === Role.INSTRUCTOR && course.instructorId !== instructorId) {
      // Return empty overview for unauthorized instructors
      return {
        enrollmentCount: 0,
        activeEnrollments: 0,
        completedEnrollments: 0,
        cancelledEnrollments: 0,
        averageCompletion: 0,
        assignmentSubmissionRate: 0,
        quizPassRate: 0,
        lessonsTotal: 0,
        lessonsAverageCompletion: 0,
        assignmentsTotal: 0,
        quizzesTotal: 0,
        liveSessionsTotal: 0,
        liveSessionsUpcoming: 0,
      };
    }

    // Get enrollments
    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
    });

    const activeEnrollments = enrollments.filter(
      (e) => e.status === 'ACTIVE',
    ).length;
    const completedEnrollments = enrollments.filter(
      (e) => e.status === 'COMPLETED',
    ).length;
    const cancelledEnrollments = enrollments.filter(
      (e) => e.status === 'CANCELLED',
    ).length;

    const averageCompletion =
      enrollments.length > 0
        ? Math.round(
            enrollments.reduce((sum, e) => sum + e.progress, 0) /
              enrollments.length,
          )
        : 0;

    // Get assignment stats
    const assignments = await this.prisma.assignment.findMany({
      where: { courseId },
      include: { submissions: true },
    });

    let totalAssignmentSubmissions = 0;
    let totalAssignmentOpportunities = 0;
    assignments.forEach((assignment) => {
      const submittedCount = assignment.submissions.filter(
        (s) => s.submittedAt !== null,
      ).length;
      totalAssignmentSubmissions += submittedCount;
      totalAssignmentOpportunities +=
        enrollments.length > 0 ? enrollments.length : 1;
    });

    const assignmentSubmissionRate =
      totalAssignmentOpportunities > 0
        ? Math.round(
            (totalAssignmentSubmissions / totalAssignmentOpportunities) * 100,
          )
        : 0;

    // Get quiz stats
    const quizzes = await this.prisma.quiz.findMany({
      where: { courseId },
      include: {
        attempts: true,
      },
    });

    let totalQuizPassed = 0;
    let totalQuizAttempts = 0;
    quizzes.forEach((quiz) => {
      const passedAttempts = quiz.attempts.filter(
        (a) => a.passing === true,
      ).length;
      totalQuizPassed += passedAttempts;
      totalQuizAttempts += quiz.attempts.length;
    });

    const quizPassRate =
      totalQuizAttempts > 0
        ? Math.round((totalQuizPassed / totalQuizAttempts) * 100)
        : 0;

    // Get lesson stats
    const lessons = await this.prisma.lesson.count({
      where: { module: { courseId } },
    });

    const lessonProgresses = await this.prisma.lessonProgress.findMany({
      where: { courseId },
    });

    const lessonsAverageCompletion =
      lessons > 0 && enrollments.length > 0
        ? Math.round(
            (lessonProgresses.filter((lp) => lp.completed).length /
              (lessons * enrollments.length)) *
              100,
          )
        : 0;

    // Get live sessions
    const liveSessions = await this.prisma.liveSession.findMany({
      where: { courseId },
    });

    const upcomingSessions = liveSessions.filter(
      (s) => s.startTime > new Date() && s.status === 'SCHEDULED',
    ).length;

    return {
      enrollmentCount: enrollments.length,
      activeEnrollments,
      completedEnrollments,
      cancelledEnrollments,
      averageCompletion,
      assignmentSubmissionRate,
      quizPassRate,
      lessonsTotal: lessons,
      lessonsAverageCompletion,
      assignmentsTotal: assignments.length,
      quizzesTotal: quizzes.length,
      liveSessionsTotal: liveSessions.length,
      liveSessionsUpcoming: upcomingSessions,
    };
  }

  /**
   * GET /analytics/courses/:courseId/students
   * Returns all enrolled students with progress
   */
  async getEnrolledStudents(
    courseId: string,
    instructorId: string,
    role: Role,
  ): Promise<StudentPerformanceDto[]> {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Instructors can only see their own courses - return empty if not owner
    if (role === Role.INSTRUCTOR && course.instructorId !== instructorId) {
      return []; // Return empty array instead of throwing
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: true,
      },
    });

    // Get total lessons in course
    const totalLessons = await this.prisma.lesson.count({
      where: { module: { courseId } },
    });

    // Get all assignments and quizzes
    const totalAssignments = await this.prisma.assignment.count({
      where: { courseId },
    });

    const totalQuizzes = await this.prisma.quiz.count({
      where: { courseId },
    });

    const totalLiveSessions = await this.prisma.liveSession.count({
      where: { courseId },
    });

    const results: StudentPerformanceDto[] = [];

    for (const enrollment of enrollments) {
      // Lessons
      const completedLessons = await this.prisma.lessonProgress.count({
        where: {
          studentId: enrollment.studentId,
          courseId,
          completed: true,
        },
      });

      const lessonsCompletionRate =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      // Assignments
      const submittedAssignments = await this.prisma.assignmentSubmission.count(
        {
          where: {
            studentId: enrollment.studentId,
            assignment: { courseId },
            submittedAt: { not: undefined },
          },
        },
      );

      const assignmentSubmissionRate =
        totalAssignments > 0
          ? Math.round((submittedAssignments / totalAssignments) * 100)
          : 0;

      const assignmentSubmissions =
        await this.prisma.assignmentSubmission.findMany({
          where: {
            studentId: enrollment.studentId,
            assignment: { courseId },
          },
        });

      const assignmentAverageScore =
        assignmentSubmissions.length > 0
          ? Math.round(
              assignmentSubmissions.reduce(
                (sum, s) => sum + (s.marks || 0),
                0,
              ) / assignmentSubmissions.length,
            )
          : 0;

      const assignmentAverageMaxScore =
        totalAssignments > 0
          ? (
              await this.prisma.assignment.aggregate({
                where: { courseId },
                _avg: { maxMarks: true },
              })
            )._avg.maxMarks || 0
          : 0;

      // Quizzes
      const quizAttempts = await this.prisma.quizAttempt.findMany({
        where: {
          studentId: enrollment.studentId,
          quiz: { courseId },
        },
      });

      const quizPassedCount = quizAttempts.filter(
        (a) => a.passing === true,
      ).length;
      const quizPassRate =
        totalQuizzes > 0
          ? Math.round((quizPassedCount / totalQuizzes) * 100)
          : 0;

      const quizAverageScore =
        quizAttempts.length > 0
          ? Math.round(
              quizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
                quizAttempts.length,
            )
          : 0;

      // Last activity
      const lastLessonProgress = await this.prisma.lessonProgress.findFirst({
        where: {
          studentId: enrollment.studentId,
          courseId,
        },
        orderBy: { lastAccessedAt: 'desc' },
      });

      const lastAssignmentSubmission =
        await this.prisma.assignmentSubmission.findFirst({
          where: {
            studentId: enrollment.studentId,
            assignment: { courseId },
          },
          orderBy: { submittedAt: 'desc' },
        });

      const lastQuizAttempt = await this.prisma.quizAttempt.findFirst({
        where: {
          studentId: enrollment.studentId,
          quiz: { courseId },
        },
        orderBy: { submittedAt: 'desc' },
      });

      let lastActivityAt = enrollment.createdAt;
      if (lastLessonProgress?.lastAccessedAt) {
        lastActivityAt = new Date(
          Math.max(
            lastActivityAt.getTime(),
            lastLessonProgress.lastAccessedAt.getTime(),
          ),
        );
      }
      if (lastAssignmentSubmission?.submittedAt) {
        lastActivityAt = new Date(
          Math.max(
            lastActivityAt.getTime(),
            lastAssignmentSubmission.submittedAt.getTime(),
          ),
        );
      }
      if (lastQuizAttempt?.submittedAt) {
        lastActivityAt = new Date(
          Math.max(
            lastActivityAt.getTime(),
            lastQuizAttempt.submittedAt.getTime(),
          ),
        );
      }

      results.push({
        studentId: enrollment.studentId,
        studentName: enrollment.student.name || 'Unknown',
        studentEmail: enrollment.student.email,
        enrollmentDate: enrollment.createdAt,
        enrollmentStatus: enrollment.status,
        progress: enrollment.progress,
        lessonsCompleted: completedLessons,
        lessonsTotal: totalLessons,
        lessonsCompletionRate,
        assignmentsSubmitted: submittedAssignments,
        assignmentsTotal: totalAssignments,
        assignmentSubmissionRate,
        assignmentAverageScore,
        assignmentAverageMaxScore,
        quizzesTaken: quizAttempts.length,
        quizzesTotal: totalQuizzes,
        quizPassedCount,
        quizPassRate,
        quizAverageScore,
        liveSessionsAttended: 0, // Enhanced when attendance model is added
        liveSessionsTotal: totalLiveSessions,
        attendanceRate: 0, // Enhanced when attendance model is added
        lastActivityAt,
      });
    }

    return results;
  }

  /**
   * GET /analytics/courses/:courseId/students/:studentId
   * Returns single student detailed view
   */
  async getStudentDashboard(
    courseId: string,
    studentId: string,
    instructorId: string,
    role: Role,
  ): Promise<StudentPerformanceDto> {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Instructors can only see their own courses
    if (role === Role.INSTRUCTOR && course.instructorId !== instructorId) {
      throw new NotFoundException('Student not enrolled in this course');
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, courseId },
      include: { student: true },
    });

    if (!enrollment) {
      throw new NotFoundException('Student not enrolled in this course');
    }

    // Get total counts
    const totalLessons = await this.prisma.lesson.count({
      where: { module: { courseId } },
    });

    const totalAssignments = await this.prisma.assignment.count({
      where: { courseId },
    });

    const totalQuizzes = await this.prisma.quiz.count({
      where: { courseId },
    });

    const totalLiveSessions = await this.prisma.liveSession.count({
      where: { courseId },
    });

    // Lessons
    const completedLessons = await this.prisma.lessonProgress.count({
      where: { studentId, courseId, completed: true },
    });

    const lessonsCompletionRate =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    // Assignments
    const submittedAssignments = await this.prisma.assignmentSubmission.count({
      where: {
        studentId,
        assignment: { courseId },
        submittedAt: { not: undefined },
      },
    });

    const assignmentSubmissionRate =
      totalAssignments > 0
        ? Math.round((submittedAssignments / totalAssignments) * 100)
        : 0;

    const assignmentSubmissions =
      await this.prisma.assignmentSubmission.findMany({
        where: {
          studentId,
          assignment: { courseId },
        },
      });

    const assignmentAverageScore =
      assignmentSubmissions.length > 0
        ? Math.round(
            assignmentSubmissions.reduce((sum, s) => sum + (s.marks || 0), 0) /
              assignmentSubmissions.length,
          )
        : 0;

    const assignmentAverageMaxScore =
      totalAssignments > 0
        ? (
            await this.prisma.assignment.aggregate({
              where: { courseId },
              _avg: { maxMarks: true },
            })
          )._avg.maxMarks || 0
        : 0;

    // Quizzes
    const quizAttempts = await this.prisma.quizAttempt.findMany({
      where: { studentId, quiz: { courseId } },
    });

    const quizPassedCount = quizAttempts.filter(
      (a) => a.passing === true,
    ).length;
    const quizPassRate =
      totalQuizzes > 0 ? Math.round((quizPassedCount / totalQuizzes) * 100) : 0;

    const quizAverageScore =
      quizAttempts.length > 0
        ? Math.round(
            quizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
              quizAttempts.length,
          )
        : 0;

    // Last activity
    const lastLessonProgress = await this.prisma.lessonProgress.findFirst({
      where: { studentId, courseId },
      orderBy: { lastAccessedAt: 'desc' },
    });

    const lastAssignmentSubmission =
      await this.prisma.assignmentSubmission.findFirst({
        where: { studentId, assignment: { courseId } },
        orderBy: { submittedAt: 'desc' },
      });

    const lastQuizAttempt = await this.prisma.quizAttempt.findFirst({
      where: { studentId, quiz: { courseId } },
      orderBy: { submittedAt: 'desc' },
    });

    let lastActivityAt = enrollment.createdAt;
    if (lastLessonProgress?.lastAccessedAt) {
      lastActivityAt = new Date(
        Math.max(
          lastActivityAt.getTime(),
          lastLessonProgress.lastAccessedAt.getTime(),
        ),
      );
    }
    if (lastAssignmentSubmission?.submittedAt) {
      lastActivityAt = new Date(
        Math.max(
          lastActivityAt.getTime(),
          lastAssignmentSubmission.submittedAt.getTime(),
        ),
      );
    }
    if (lastQuizAttempt?.submittedAt) {
      lastActivityAt = new Date(
        Math.max(
          lastActivityAt.getTime(),
          lastQuizAttempt.submittedAt.getTime(),
        ),
      );
    }

    return {
      studentId,
      studentName: enrollment.student.name || 'Unknown',
      studentEmail: enrollment.student.email,
      enrollmentDate: enrollment.createdAt,
      enrollmentStatus: enrollment.status,
      progress: enrollment.progress,
      lessonsCompleted: completedLessons,
      lessonsTotal: totalLessons,
      lessonsCompletionRate,
      assignmentsSubmitted: submittedAssignments,
      assignmentsTotal: totalAssignments,
      assignmentSubmissionRate,
      assignmentAverageScore,
      assignmentAverageMaxScore,
      quizzesTaken: quizAttempts.length,
      quizzesTotal: totalQuizzes,
      quizPassedCount,
      quizPassRate,
      quizAverageScore,
      liveSessionsAttended: 0, // Enhanced when attendance model is added
      liveSessionsTotal: totalLiveSessions,
      attendanceRate: 0, // Enhanced when attendance model is added
      lastActivityAt,
    };
  }

  /**
   * GET /analytics/courses/:courseId/assignments
   * Returns assignment submission stats
   */
  async getAssignmentStats(
    courseId: string,
    instructorId: string,
    role: Role,
  ): Promise<AssignmentAnalyticsDto[]> {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Instructors can only see their own courses - return empty if not owner
    if (role === Role.INSTRUCTOR && course.instructorId !== instructorId) {
      return []; // Return empty array instead of throwing
    }

    const totalEnrolled = await this.prisma.enrollment.count({
      where: { courseId },
    });

    const assignments = await this.prisma.assignment.findMany({
      where: { courseId },
      include: {
        module: true,
        submissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map((assignment) => {
      const submittedCount = assignment.submissions.filter(
        (s) => s.submittedAt !== null,
      ).length;
      const gradedCount = assignment.submissions.filter(
        (s) => s.gradedAt !== null,
      ).length;
      const pendingGradingCount = submittedCount - gradedCount;

      const submittedWithMarks = assignment.submissions.filter(
        (s) => s.marks !== null && s.submittedAt !== null,
      );

      const averageScore =
        submittedWithMarks.length > 0
          ? Math.round(
              submittedWithMarks.reduce((sum, s) => sum + (s.marks || 0), 0) /
                submittedWithMarks.length,
            )
          : 0;

      const highestScore =
        submittedWithMarks.length > 0
          ? Math.max(...submittedWithMarks.map((s) => s.marks || 0))
          : 0;

      const lowestScore =
        submittedWithMarks.length > 0
          ? Math.min(...submittedWithMarks.map((s) => s.marks || 0))
          : 0;

      const onTimeSubmissions = assignment.submissions.filter((s) => {
        if (!s.submittedAt || !assignment.dueDate) return false;
        return s.submittedAt <= assignment.dueDate;
      }).length;

      const lateSubmissions = submittedCount - onTimeSubmissions;

      return {
        assignmentId: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        maxMarks: assignment.maxMarks,
        submittedCount,
        totalEnrolled,
        submissionRate:
          totalEnrolled > 0
            ? Math.round((submittedCount / totalEnrolled) * 100)
            : 0,
        notSubmittedCount: totalEnrolled - submittedCount,
        gradedCount,
        pendingGradingCount,
        averageScore,
        highestScore,
        lowestScore,
        onTimeSubmissions,
        lateSubmissions,
        deadlineMissRate:
          submittedCount > 0
            ? Math.round((lateSubmissions / submittedCount) * 100)
            : 0,
        updatedAt: assignment.updatedAt,
      };
    });
  }

  /**
   * GET /analytics/courses/:courseId/quizzes
   * Returns quiz attempt stats
   */
  async getQuizStats(
    courseId: string,
    instructorId: string,
    role: Role,
  ): Promise<QuizAnalyticsDto[]> {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Instructors can only see their own courses - return empty if not owner
    if (role === Role.INSTRUCTOR && course.instructorId !== instructorId) {
      return []; // Return empty array instead of throwing
    }

    const totalEnrolled = await this.prisma.enrollment.count({
      where: { courseId },
    });

    const quizzes = await this.prisma.quiz.findMany({
      where: { courseId },
      include: {
        module: true,
        questions: {
          include: { options: true },
        },
        attempts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map((quiz) => {
      const totalMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);
      const uniqueStudents = new Set(quiz.attempts.map((a) => a.studentId))
        .size;
      const passedCount = quiz.attempts.filter(
        (a) => a.passing === true,
      ).length;

      const attemptsWithScores = quiz.attempts.filter((a) => a.score !== null);

      const averageScore =
        attemptsWithScores.length > 0
          ? Math.round(
              attemptsWithScores.reduce((sum, a) => sum + (a.score || 0), 0) /
                attemptsWithScores.length,
            )
          : 0;

      const highestScore =
        attemptsWithScores.length > 0
          ? Math.max(...attemptsWithScores.map((a) => a.score || 0))
          : 0;

      const lowestScore =
        attemptsWithScores.length > 0
          ? Math.min(...attemptsWithScores.map((a) => a.score || 0))
          : 0;

      const averageTimeSpent =
        quiz.attempts.length > 0
          ? Math.round(
              quiz.attempts.reduce((sum, a) => {
                if (a.submittedAt && a.startedAt) {
                  return (
                    sum +
                    (a.submittedAt.getTime() - a.startedAt.getTime()) / 1000
                  );
                }
                return sum;
              }, 0) / quiz.attempts.length,
            )
          : 0;

      return {
        quizId: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore || 0,
        timeLimit: quiz.timeLimit || 0,
        totalQuestions: quiz.questions.length,
        totalMarks,
        attemptCount: quiz.attempts.length,
        uniqueStudentsAttempted: uniqueStudents,
        totalEnrolled,
        attemptRate:
          totalEnrolled > 0
            ? Math.round((uniqueStudents / totalEnrolled) * 100)
            : 0,
        averageScore,
        highestScore,
        lowestScore,
        passedCount,
        failedCount: quiz.attempts.length - passedCount,
        passRate:
          quiz.attempts.length > 0
            ? Math.round((passedCount / quiz.attempts.length) * 100)
            : 0,
        averageTimeSpent,
        published: quiz.published,
        updatedAt: quiz.updatedAt,
      };
    });
  }

  /**
   * GET /analytics/courses/:courseId/lessons
   * Returns lesson completion rates
   */
  async getLessonStats(
    courseId: string,
    instructorId: string,
    role: Role,
  ): Promise<LessonAnalyticsDto[]> {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Instructors can only see their own courses - return empty if not owner
    if (role === Role.INSTRUCTOR && course.instructorId !== instructorId) {
      return []; // Return empty array instead of throwing
    }

    const totalEnrolled = await this.prisma.enrollment.count({
      where: { courseId },
    });

    const modules = await this.prisma.courseModule.findMany({
      where: { courseId },
      include: {
        lessons: true,
      },
    });

    const results: LessonAnalyticsDto[] = [];

    for (const module of modules) {
      for (const lesson of module.lessons) {
        const progressRecords = await this.prisma.lessonProgress.findMany({
          where: { lessonId: lesson.id, courseId },
        });

        const completedCount = progressRecords.filter(
          (p) => p.completed,
        ).length;
        const viewCount = progressRecords.length;
        const uniqueStudentsViewed = new Set(
          progressRecords.map((p) => p.studentId),
        ).size;

        const averageLastAccess =
          progressRecords.length > 0
            ? new Date(
                Math.round(
                  progressRecords.reduce(
                    (sum, p) => sum + p.lastAccessedAt.getTime(),
                    0,
                  ) / progressRecords.length,
                ),
              )
            : new Date();

        results.push({
          lessonId: lesson.id,
          title: lesson.title,
          type: lesson.type,
          moduleId: module.id,
          moduleName: module.title,
          viewCount,
          uniqueStudentsViewed,
          uniqueStudentsCompleted: completedCount,
          totalEnrolled,
          completionRate:
            totalEnrolled > 0
              ? Math.round((completedCount / totalEnrolled) * 100)
              : 0,
          viewRate:
            totalEnrolled > 0
              ? Math.round((uniqueStudentsViewed / totalEnrolled) * 100)
              : 0,
          averageTimeSpent: 0, // Can be enhanced with actual time tracking
          averageLastAccess,
          orderIndex: lesson.orderIndex,
          createdAt: lesson.id ? new Date() : new Date(), // Lessons don't have createdAt in schema
        });
      }
    }

    return results;
  }

  /**
   * GET /analytics/courses/:courseId/live-sessions
   * Returns live session stats
   */
  async getLiveSessionStats(
    courseId: string,
    instructorId: string,
    role: Role,
  ): Promise<LiveSessionAnalyticsDto[]> {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Instructors can only see their own courses - return empty if not owner
    if (role === Role.INSTRUCTOR && course.instructorId !== instructorId) {
      return []; // Return empty array instead of throwing
    }

    const totalEnrolled = await this.prisma.enrollment.count({
      where: { courseId },
    });

    const liveSessions = await this.prisma.liveSession.findMany({
      where: { courseId },
      include: {
        module: true,
      },
      orderBy: { startTime: 'desc' },
    });

    return liveSessions.map((session) => ({
      sessionId: session.id,
      title: session.title,
      description: session.description,
      moduleId: session.moduleId,
      moduleName: session.module?.title || 'N/A',
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      estimatedAttendees: totalEnrolled,
      scheduledCount: totalEnrolled, // Will be enhanced with actual attendance tracking
      zoomMeetingId: session.zoomMeetingId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));
  }
}
