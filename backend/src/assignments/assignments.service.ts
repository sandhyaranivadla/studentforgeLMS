import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { Role, NotificationType } from '@prisma/client';

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /* ── Assignment CRUD ──────────────────────────────────────── */

  async createAssignment(
    courseId: string,
    userId: string,
    createAssignmentDto: CreateAssignmentDto,
    userRole: Role,
  ) {
    // Verify course exists and user is the owner
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only create assignments for your own courses',
      );
    }

    // If moduleId provided, verify it belongs to this course
    if (createAssignmentDto.moduleId) {
      const module = await this.prisma.courseModule.findUnique({
        where: { id: createAssignmentDto.moduleId },
      });
      if (!module || module.courseId !== courseId) {
        throw new NotFoundException(
          'Module not found or does not belong to this course',
        );
      }
    }

    return this.prisma.assignment.create({
      data: {
        courseId,
        title: createAssignmentDto.title,
        description: createAssignmentDto.description,
        instructions: createAssignmentDto.instructions,
        dueDate: createAssignmentDto.dueDate
          ? new Date(createAssignmentDto.dueDate)
          : null,
        maxMarks: createAssignmentDto.maxMarks || 0,
        moduleId: createAssignmentDto.moduleId || null,
      },
      include: { course: true, module: true, submissions: true },
    });
  }

  async findAllByCourse(courseId: string, userId: string, userRole: Role) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    // Students can only access assignments for enrolled courses
    if (userRole === Role.STUDENT) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: { courseId, studentId: userId },
      });
      if (!enrollment) {
        return []; // Return empty array instead of throwing
      }
    }

    // Instructors can only see their own courses - return empty if not owner
    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      return []; // Return empty array instead of throwing
    }

    return this.prisma.assignment.findMany({
      where: { courseId },
      include: { course: true, module: true, submissions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        course: true,
        module: true,
        submissions: true,
      },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    // Students can only access assignments in enrolled courses
    if (userRole === Role.STUDENT) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          courseId: assignment.courseId,
          studentId: userId,
        },
      });
      if (!enrollment) {
        throw new NotFoundException('Assignment not found'); // Return 404 instead of 403
      }
    }

    // Instructors can only view their own assignments - return 404 instead of 403
    if (
      userRole === Role.INSTRUCTOR &&
      assignment.course.instructorId !== userId
    ) {
      throw new NotFoundException('Assignment not found');
    }

    return assignment;
  }

  async updateAssignment(
    id: string,
    userId: string,
    updateAssignmentDto: UpdateAssignmentDto,
    userRole: Role,
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    if (userRole !== Role.ADMIN && assignment.course.instructorId !== userId) {
      throw new ForbiddenException('You can only update your own assignments');
    }

    // If moduleId provided, verify it belongs to the course
    if (updateAssignmentDto.moduleId) {
      const module = await this.prisma.courseModule.findUnique({
        where: { id: updateAssignmentDto.moduleId },
      });
      if (!module || module.courseId !== assignment.courseId) {
        throw new NotFoundException(
          'Module not found or does not belong to this course',
        );
      }
    }

    return this.prisma.assignment.update({
      where: { id },
      data: {
        title: updateAssignmentDto.title,
        description: updateAssignmentDto.description,
        instructions: updateAssignmentDto.instructions,
        dueDate: updateAssignmentDto.dueDate
          ? new Date(updateAssignmentDto.dueDate)
          : undefined,
        maxMarks: updateAssignmentDto.maxMarks,
        moduleId: updateAssignmentDto.moduleId,
      },
      include: { course: true, module: true, submissions: true },
    });
  }

  async deleteAssignment(id: string, userId: string, userRole: Role) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    if (userRole !== Role.ADMIN && assignment.course.instructorId !== userId) {
      throw new ForbiddenException('You can only delete your own assignments');
    }

    return this.prisma.assignment.delete({
      where: { id },
    });
  }

  /* ── Submission CRUD ──────────────────────────────────────── */

  async submitAssignment(
    assignmentId: string,
    studentId: string,
    createSubmissionDto: CreateSubmissionDto,
  ) {
    // Verify assignment exists
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    // Verify student is enrolled in the course
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        courseId: assignment.courseId,
        studentId,
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    // Check for existing submission
    const existingSubmission =
      await this.prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId,
          },
        },
      });

    let submission;
    if (existingSubmission) {
      // Update existing submission
      submission = await this.prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          submissionText: createSubmissionDto.submissionText,
          submittedAt: new Date(),
          marks: null,
          feedback: null,
          gradedAt: null,
        },
        include: { student: true },
      });
    } else {
      // Create new submission
      submission = await this.prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          studentId,
          submissionText: createSubmissionDto.submissionText,
        },
        include: { student: true },
      });
    }

    // Send notification to instructor
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: assignment.courseId },
      });

      if (course) {
        await this.notificationsService.createNotification(
          course.instructorId,
          assignment.courseId,
          NotificationType.ASSIGNMENT_SUBMITTED,
          `New submission: ${assignment.title}`,
          `${submission.student.name || submission.student.email} submitted "${assignment.title}"`,
          submission.id,
          'ASSIGNMENT_SUBMISSION',
          `/dashboard/instructor/assignments/${assignmentId}/submissions`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to create notification for submission: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Don't throw - submission should succeed even if notification fails
    }

    return submission;
  }

  async getSubmissions(assignmentId: string, userId: string, userRole: Role) {
    // Verify assignment exists and user is the instructor
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    if (userRole !== Role.ADMIN && assignment.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only view submissions for your own assignments',
      );
    }

    return this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: { select: { id: true, email: true, name: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getSubmission(submissionId: string, userId: string, userRole: Role) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { include: { course: true } },
        student: { select: { id: true, email: true, name: true } },
      },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    // Student can only see their own submission
    if (userRole === Role.STUDENT && submission.student.id !== userId) {
      throw new ForbiddenException('You can only view your own submissions');
    }

    // Instructor can only see submissions for their assignments
    if (
      userRole === Role.INSTRUCTOR &&
      submission.assignment.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'You can only view submissions for your own assignments',
      );
    }

    return submission;
  }

  async getMySubmissions(studentId: string) {
    return this.prisma.assignmentSubmission.findMany({
      where: { studentId },
      include: {
        assignment: {
          include: { course: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async gradeSubmission(
    submissionId: string,
    userId: string,
    updateSubmissionDto: UpdateSubmissionDto,
    userRole: Role,
  ) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { include: { course: true } },
        student: true,
      },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    if (
      userRole !== Role.ADMIN &&
      submission.assignment.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'You can only grade submissions for your own assignments',
      );
    }

    const updated = await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marks: updateSubmissionDto.marks,
        feedback: updateSubmissionDto.feedback,
        gradedAt: new Date(),
      },
      include: {
        student: { select: { id: true, email: true, name: true } },
        assignment: true,
      },
    });

    // Send notification to student
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: submission.assignment.courseId },
      });

      if (course) {
        await this.notificationsService.createNotification(
          submission.student.id,
          submission.assignment.courseId,
          NotificationType.ASSIGNMENT_GRADED,
          `Graded: ${submission.assignment.title}`,
          `Your assignment "${submission.assignment.title}" has been graded. Marks: ${updateSubmissionDto.marks}/${submission.assignment.maxMarks}`,
          submissionId,
          'ASSIGNMENT_SUBMISSION',
          `/dashboard/student/assignments/${submission.assignment.id}/submission`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to create notification for grading: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Don't throw - grading should succeed even if notification fails
    }

    return updated;
  }
}
