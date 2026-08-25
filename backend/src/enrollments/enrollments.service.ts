import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
} from './dto/create-enrollment.dto';
import { Role } from '@prisma/client';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async checkEnrollment(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, courseId },
    });
    return { enrolled: !!enrollment, enrollment: enrollment ?? null };
  }

  async create(userId: string, createEnrollmentDto: CreateEnrollmentDto, userRole?: Role) {
    const studentId = (userRole === Role.ADMIN && createEnrollmentDto.studentId) ? createEnrollmentDto.studentId : userId;

    // Prevent duplicate enrollment
    const existing = await this.prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId: createEnrollmentDto.courseId,
      },
    });

    if (existing) {
      throw new ConflictException('Already enrolled in this course');
    }

    // Check if course exists and is published
    const course = await this.prisma.course.findUnique({
      where: { id: createEnrollmentDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!course.published && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Cannot enroll in an unpublished course');
    }

    return this.prisma.enrollment.create({
      data: {
        studentId,
        courseId: createEnrollmentDto.courseId,
      },
    });
  }

  async findAll(userId: string, userRole: Role) {
    if (userRole === Role.STUDENT) {
      return this.prisma.enrollment.findMany({
        where: { studentId: userId },
        include: { course: true },
      });
    } else if (userRole === Role.INSTRUCTOR) {
      // Instructors might see enrollments for their own courses
      return this.prisma.enrollment.findMany({
        where: { course: { instructorId: userId } },
        include: {
          student: { select: { name: true, email: true } },
          course: true,
        },
      });
    } else {
      return this.prisma.enrollment.findMany({
        include: {
          student: { select: { name: true, email: true } },
          course: true,
        },
      });
    }
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (userRole === Role.STUDENT && enrollment.studentId !== userId) {
      throw new ForbiddenException('You can only view your own enrollments');
    }

    return enrollment;
  }

  async update(
    id: string,
    userId: string,
    updateEnrollmentDto: UpdateEnrollmentDto,
    userRole: Role,
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (userRole === Role.STUDENT && enrollment.studentId !== userId) {
      throw new ForbiddenException('You can only update your own enrollments');
    }

    return this.prisma.enrollment.update({
      where: { id },
      data: updateEnrollmentDto,
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (userRole === Role.STUDENT && enrollment.studentId !== userId) {
      throw new ForbiddenException('You can only cancel your own enrollments');
    }

    return this.prisma.enrollment.delete({ where: { id } });
  }
}
