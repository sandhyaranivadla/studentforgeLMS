import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, LiveSessionStatus } from '@prisma/client';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';
import { UpdateLiveSessionStatusDto } from './dto/live-session-status.dto';
import { ZoomService } from './zoom.service';

@Injectable()
export class LiveSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zoomService: ZoomService,
  ) {}

  /* ── Live Session CRUD ──────────────────────────────────────── */

  async createLiveSession(
    courseId: string,
    userId: string,
    createLiveSessionDto: CreateLiveSessionDto,
    userRole: Role,
  ) {
    // Verify course exists and user is the owner
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only create live sessions for your own courses',
      );
    }

    // Parse dates
    const startTime = new Date(createLiveSessionDto.startTime);
    const endTime = createLiveSessionDto.endTime
      ? new Date(createLiveSessionDto.endTime)
      : null;

    // Validate dates
    if (isNaN(startTime.getTime())) {
      throw new BadRequestException('Invalid startTime format');
    }

    if (endTime && isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid endTime format');
    }

    if (endTime && endTime <= startTime) {
      throw new BadRequestException('endTime must be after startTime');
    }

    // If moduleId provided, verify it belongs to this course
    if (createLiveSessionDto.moduleId) {
      const module = await this.prisma.courseModule.findUnique({
        where: { id: createLiveSessionDto.moduleId },
      });
      if (!module || module.courseId !== courseId) {
        throw new NotFoundException(
          'Module not found or does not belong to this course',
        );
      }
    }

    return this.prisma.liveSession.create({
      data: {
        courseId,
        moduleId: createLiveSessionDto.moduleId || null,
        title: createLiveSessionDto.title,
        description: createLiveSessionDto.description || null,
        startTime,
        endTime,
        status: LiveSessionStatus.SCHEDULED,
      },
      include: {
        course: true,
        module: true,
      },
    });
  }

  async findAllByCourse(courseId: string, userId: string, userRole: Role) {
    // Verify course exists and user has access
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    // Instructors can only see their own courses - return empty if not owner
    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      return []; // Return empty array instead of throwing
    }

    return this.prisma.liveSession.findMany({
      where: { courseId },
      include: {
        course: true,
        module: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findUpcoming(userId: string, userRole: Role) {
    // Get all courses owned by instructor
    const courses = await this.prisma.course.findMany({
      where: userRole === Role.ADMIN ? {} : { instructorId: userId },
      select: { id: true },
    });

    const courseIds = courses.map((c) => c.id);

    if (courseIds.length === 0) {
      return [];
    }

    const now = new Date();

    return this.prisma.liveSession.findMany({
      where: {
        courseId: { in: courseIds },
        startTime: { gt: now },
        status: LiveSessionStatus.SCHEDULED,
      },
      include: {
        course: true,
        module: true,
      },
      orderBy: { startTime: 'asc' },
      take: 10, // Limit to next 10 upcoming sessions
    });
  }

  async findPast(userId: string, userRole: Role) {
    // Get all courses owned by instructor
    const courses = await this.prisma.course.findMany({
      where: userRole === Role.ADMIN ? {} : { instructorId: userId },
      select: { id: true },
    });

    const courseIds = courses.map((c) => c.id);

    if (courseIds.length === 0) {
      return [];
    }

    const now = new Date();

    return this.prisma.liveSession.findMany({
      where: {
        courseId: { in: courseIds },
        OR: [
          { startTime: { lt: now } },
          { status: LiveSessionStatus.COMPLETED },
          { status: LiveSessionStatus.CANCELLED },
        ],
      },
      include: {
        course: true,
        module: true,
      },
      orderBy: { startTime: 'desc' },
      take: 20,
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const liveSession = await this.prisma.liveSession.findUnique({
      where: { id },
      include: {
        course: true,
        module: true,
      },
    });

    if (!liveSession) throw new NotFoundException('Live session not found');

    // Instructors can only access their own sessions - return 404 instead of 403
    if (userRole === Role.INSTRUCTOR && liveSession.course.instructorId !== userId) {
      throw new NotFoundException('Live session not found');
    }

    return liveSession;
  }

  async updateLiveSession(
    id: string,
    userId: string,
    updateLiveSessionDto: UpdateLiveSessionDto,
    userRole: Role,
  ) {
    // Verify session exists and user is the owner
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!session) throw new NotFoundException('Live session not found');

    if (userRole !== Role.ADMIN && session.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only update your own live sessions',
      );
    }

    // Can only edit if SCHEDULED
    if (session.status !== LiveSessionStatus.SCHEDULED) {
      throw new BadRequestException('Can only edit scheduled sessions');
    }

    // Validate dates if provided
    const startTime = updateLiveSessionDto.startTime
      ? new Date(updateLiveSessionDto.startTime)
      : undefined;
    const endTime = updateLiveSessionDto.endTime
      ? new Date(updateLiveSessionDto.endTime)
      : undefined;

    if (startTime && isNaN(startTime.getTime())) {
      throw new BadRequestException('Invalid startTime format');
    }

    if (endTime && isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid endTime format');
    }

    const finalStartTime = startTime || session.startTime;
    const finalEndTime = endTime || session.endTime;

    if (finalEndTime && finalEndTime <= finalStartTime) {
      throw new BadRequestException('endTime must be after startTime');
    }

    return this.prisma.liveSession.update({
      where: { id },
      data: {
        title: updateLiveSessionDto.title || undefined,
        description: updateLiveSessionDto.description || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      },
      include: {
        course: true,
        module: true,
      },
    });
  }

  async deleteLiveSession(id: string, userId: string, userRole: Role) {
    // Verify session exists and user is the owner
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!session) throw new NotFoundException('Live session not found');

    if (userRole !== Role.ADMIN && session.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own live sessions',
      );
    }

    // Can only delete if SCHEDULED or CANCELLED
    if (
      session.status !== LiveSessionStatus.SCHEDULED &&
      session.status !== LiveSessionStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Can only delete scheduled or cancelled sessions',
      );
    }

    return this.prisma.liveSession.delete({
      where: { id },
    });
  }

  async updateStatus(
    id: string,
    userId: string,
    updateStatusDto: UpdateLiveSessionStatusDto,
    userRole: Role,
  ) {
    // Verify session exists and user is the owner
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!session) throw new NotFoundException('Live session not found');

    if (userRole !== Role.ADMIN && session.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only update your own live sessions',
      );
    }

    // Validate status transitions
    const validTransitions: Record<LiveSessionStatus, LiveSessionStatus[]> = {
      [LiveSessionStatus.SCHEDULED]: [
        LiveSessionStatus.LIVE,
        LiveSessionStatus.CANCELLED,
      ],
      [LiveSessionStatus.LIVE]: [LiveSessionStatus.COMPLETED],
      [LiveSessionStatus.COMPLETED]: [],
      [LiveSessionStatus.CANCELLED]: [],
    };

    if (!validTransitions[session.status].includes(updateStatusDto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${session.status} to ${updateStatusDto.status}`,
      );
    }

    return this.prisma.liveSession.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
      },
      include: {
        course: true,
        module: true,
      },
    });
  }

  async setZoomLink(
    id: string,
    userId: string,
    zoomMeetingId: string,
    userRole: Role,
  ) {
    // Verify session exists and user is the owner
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!session) throw new NotFoundException('Live session not found');

    if (userRole !== Role.ADMIN && session.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only update your own live sessions',
      );
    }

    if (!zoomMeetingId || zoomMeetingId.trim().length === 0) {
      throw new BadRequestException('Zoom meeting ID is required');
    }

    return this.prisma.liveSession.update({
      where: { id },
      data: {
        zoomMeetingId: zoomMeetingId.trim(),
      },
      include: {
        course: true,
        module: true,
      },
    });
  }

  /* ── Cross-instructor Security ──────────────────────────────────────── */

  /**
   * Private helper: Verify ownership before operations
   * Prevents instructors from accessing other instructors' sessions
   */
  private async verifyOwnership(
    sessionId: string,
    userId: string,
    userRole: Role,
  ): Promise<boolean> {
    if (userRole === Role.ADMIN) return true;

    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: { course: true },
    });

    return session ? session.course.instructorId === userId : false;
  }
}
