import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  // ─── Internal helpers ─────────────────────────────────────────────────────

  /**
   * Verify the student is enrolled in the given course.
   * Returns the enrollment record.
   */
  private async requireEnrollment(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, courseId },
    });
    if (!enrollment) {
      throw new ForbiddenException(
        'You must be enrolled in this course to track progress.',
      );
    }
    return enrollment;
  }

  /**
   * Verify the lesson belongs to the given course.
   * Returns the lesson with its module.
   */
  private async requireLessonInCourse(lessonId: string, courseId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: true },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found.');
    }
    if (lesson.module.courseId !== courseId) {
      throw new BadRequestException(
        'This lesson does not belong to the specified course.',
      );
    }
    return lesson;
  }

  /**
   * Recalculate progress % and update Enrollment.progress.
   * Also flips status to COMPLETED when 100%.
   */
  private async recalculateProgress(
    studentId: string,
    courseId: string,
    enrollmentId: string,
  ) {
    // Total lessons in the course
    const totalLessons = await this.prisma.lesson.count({
      where: { module: { courseId } },
    });

    if (totalLessons === 0) {
      // Nothing to complete — leave at 0 and ACTIVE
      return this.prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { progress: 0 },
      });
    }

    // How many distinct lessons the student has completed in this course
    const completedCount = await this.prisma.lessonProgress.count({
      where: { studentId, courseId, completed: true },
    });

    const progress = Math.round((completedCount / totalLessons) * 100);
    const status = progress === 100 ? 'COMPLETED' : 'ACTIVE';

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progress, status },
    });
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * POST /progress/courses/:courseId/lessons/:lessonId/complete
   *
   * Mark a lesson complete for the authenticated student.
   * - Verifies enrollment.
   * - Verifies lesson belongs to course.
   * - Creates or updates LessonProgress (idempotent: no error on repeat).
   * - Recalculates and persists Enrollment.progress.
   */
  async completeLesson(studentId: string, courseId: string, lessonId: string) {
    // Guard: enrolled?
    const enrollment = await this.requireEnrollment(studentId, courseId);

    // Guard: lesson in this course?
    await this.requireLessonInCourse(lessonId, courseId);

    // Check for existing record
    const existing = await this.prisma.lessonProgress.findUnique({
      where: { studentId_lessonId: { studentId, lessonId } },
    });

    if (existing?.completed) {
      throw new ConflictException('Lesson already marked as complete.');
    }

    // Upsert: create first-time or mark previously-accessed as complete
    const lessonProgress = await this.prisma.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId, lessonId } },
      create: {
        studentId,
        lessonId,
        courseId,
        completed: true,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
      },
      update: {
        completed: true,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
      },
    });

    // Recalculate and persist
    const updatedEnrollment = await this.recalculateProgress(
      studentId,
      courseId,
      enrollment.id,
    );

    return { lessonProgress, enrollment: updatedEnrollment };
  }

  /**
   * POST /progress/courses/:courseId/lessons/:lessonId/access
   *
   * Record that a student opened a lesson (updates lastAccessedAt).
   * Does NOT mark it complete. Non-throwing — best-effort.
   */
  async accessLesson(studentId: string, courseId: string, lessonId: string) {
    await this.requireEnrollment(studentId, courseId);
    await this.requireLessonInCourse(lessonId, courseId);

    return this.prisma.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId, lessonId } },
      create: {
        studentId,
        lessonId,
        courseId,
        completed: false,
        lastAccessedAt: new Date(),
      },
      update: { lastAccessedAt: new Date() },
    });
  }

  /**
   * GET /progress/courses/:courseId
   *
   * Returns:
   * - The enrollment record (with current progress %)
   * - All LessonProgress rows for this student in this course
   * - A convenience set of completedLessonIds
   */
  async getCourseProgress(studentId: string, courseId: string) {
    const enrollment = await this.requireEnrollment(studentId, courseId);

    const lessonProgressRows = await this.prisma.lessonProgress.findMany({
      where: { studentId, courseId },
      orderBy: { lastAccessedAt: 'desc' },
    });

    const completedLessonIds = lessonProgressRows
      .filter((lp) => lp.completed)
      .map((lp) => lp.lessonId);

    return {
      enrollment,
      lessonProgress: lessonProgressRows,
      completedLessonIds,
    };
  }

  /**
   * GET /progress/courses/:courseId/lessons/:lessonId
   *
   * Returns the completion status of a single lesson for the student.
   */
  async getLessonProgress(
    studentId: string,
    courseId: string,
    lessonId: string,
  ) {
    await this.requireEnrollment(studentId, courseId);
    await this.requireLessonInCourse(lessonId, courseId);

    const record = await this.prisma.lessonProgress.findUnique({
      where: { studentId_lessonId: { studentId, lessonId } },
    });

    return {
      lessonId,
      completed: record?.completed ?? false,
      completedAt: record?.completedAt ?? null,
      lastAccessedAt: record?.lastAccessedAt ?? null,
    };
  }
}
