import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Role, AnnouncementStatus, NotificationType } from '@prisma/client';

export interface CreateAnnouncementDto {
  courseId: string;
  title: string;
  content: string;
  status?: AnnouncementStatus;
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  status?: AnnouncementStatus;
}

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Verify instructor owns the course or user is admin
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
   * Create a new announcement
   */
  async create(
    courseId: string,
    userId: string,
    createAnnouncementDto: CreateAnnouncementDto,
    userRole: Role,
  ) {
    // Verify course ownership
    await this.verifyCourseOwnership(courseId, userId, userRole);

    // Determine status and publishedAt timestamp
    const status = createAnnouncementDto.status || AnnouncementStatus.DRAFT;
    const publishedAt =
      status === AnnouncementStatus.PUBLISHED ? new Date() : null;

    return this.prisma.announcement.create({
      data: {
        courseId,
        instructorId: userId,
        title: createAnnouncementDto.title,
        content: createAnnouncementDto.content,
        status,
        publishedAt,
      },
      include: {
        course: { select: { title: true } },
        instructor: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Get all announcements for a course (instructor/admin only - sees all)
   */
  async findAllByCourse(courseId: string, userId: string, userRole: Role) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Instructors can only see their own courses - return empty if not owner
    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      return []; // Return empty array instead of throwing
    }

    return this.prisma.announcement.findMany({
      where: { courseId },
      include: {
        course: { select: { title: true } },
        instructor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  /**
   * Get published announcements for a course (students see only published)
   */
  async findPublishedByCourse(
    courseId: string,
    userId: string,
    userRole: Role,
  ) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // For students: verify enrollment
    if (userRole === Role.STUDENT) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: { studentId: userId, courseId },
      });

      if (!enrollment) {
        throw new ForbiddenException('You are not enrolled in this course');
      }
    }

    // For instructors viewing other courses: only show published
    // (they can't view all if they don't own it)
    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      return this.prisma.announcement.findMany({
        where: {
          courseId,
          status: AnnouncementStatus.PUBLISHED,
        },
        include: {
          course: { select: { title: true } },
          instructor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { publishedAt: 'desc' },
      });
    }

    // For admins or course owner: return published announcements
    return this.prisma.announcement.findMany({
      where: {
        courseId,
        status: AnnouncementStatus.PUBLISHED,
      },
      include: {
        course: { select: { title: true } },
        instructor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  /**
   * Get a single announcement
   */
  async findOne(id: string, userId: string, userRole: Role) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { id: true, name: true, email: true } },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Students can only see published announcements in courses they're enrolled in
    if (userRole === Role.STUDENT) {
      if (announcement.status !== AnnouncementStatus.PUBLISHED) {
        throw new ForbiddenException('You cannot view this announcement');
      }

      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          studentId: userId,
          courseId: announcement.courseId,
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('You are not enrolled in this course');
      }
    }

    // Instructors can only see announcements from their own courses (or any if admin)
    if (userRole === Role.INSTRUCTOR && announcement.instructor.id !== userId) {
      throw new ForbiddenException('You cannot view this announcement');
    }

    return announcement;
  }

  /**
   * Update an announcement
   */
  async update(
    id: string,
    userId: string,
    updateAnnouncementDto: UpdateAnnouncementDto,
    userRole: Role,
  ) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Verify ownership (only creator or admin can update)
    if (userRole !== Role.ADMIN && announcement.instructorId !== userId) {
      throw new ForbiddenException('You cannot update this announcement');
    }

    // Handle status change
    let publishedAt = announcement.publishedAt;
    const isTransitioningToPublished =
      updateAnnouncementDto.status &&
      updateAnnouncementDto.status !== announcement.status &&
      updateAnnouncementDto.status === AnnouncementStatus.PUBLISHED &&
      !publishedAt;

    if (isTransitioningToPublished) {
      // Transitioning from DRAFT to PUBLISHED
      publishedAt = new Date();
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: {
        title: updateAnnouncementDto.title || announcement.title,
        content: updateAnnouncementDto.content || announcement.content,
        status: updateAnnouncementDto.status || announcement.status,
        publishedAt,
      },
      include: {
        course: { select: { title: true } },
        instructor: { select: { id: true, name: true, email: true } },
      },
    });

    // Send notifications to all enrolled students when publishing
    if (isTransitioningToPublished) {
      try {
        const enrollments = await this.prisma.enrollment.findMany({
          where: { courseId: announcement.courseId },
          select: { studentId: true },
        });

        // Batch create notifications for all students
        await Promise.all(
          enrollments.map((enrollment) =>
            this.notificationsService.createNotification(
              enrollment.studentId,
              announcement.courseId,
              NotificationType.ANNOUNCEMENT_PUBLISHED,
              `New announcement: ${updated.title}`,
              updated.content.substring(0, 100) +
                (updated.content.length > 100 ? '...' : ''),
              id,
              'ANNOUNCEMENT',
              `/dashboard/student/announcements/${id}`,
            ),
          ),
        );

        this.logger.log(
          `Announcement published: sent to ${enrollments.length} students`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send announcement notifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        // Don't throw - announcement should be published even if notification fails
      }
    }

    return updated;
  }

  /**
   * Delete an announcement
   */
  async delete(id: string, userId: string, userRole: Role) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Verify ownership (only creator or admin can delete)
    if (userRole !== Role.ADMIN && announcement.instructorId !== userId) {
      throw new ForbiddenException('You cannot delete this announcement');
    }

    return this.prisma.announcement.delete({
      where: { id },
    });
  }
}
