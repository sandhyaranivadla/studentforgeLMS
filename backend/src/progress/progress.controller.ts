import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /**
   * POST /progress/courses/:courseId/lessons/:lessonId/complete
   * Mark a lesson as complete for the authenticated student.
   */
  @Roles(Role.STUDENT)
  @Post('courses/:courseId/lessons/:lessonId/complete')
  completeLesson(
    @Request() req: AuthRequest,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.completeLesson(req.user.id, courseId, lessonId);
  }

  /**
   * POST /progress/courses/:courseId/lessons/:lessonId/access
   * Record lesson access (updates lastAccessedAt, does not complete).
   */
  @Roles(Role.STUDENT)
  @Post('courses/:courseId/lessons/:lessonId/access')
  accessLesson(
    @Request() req: AuthRequest,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.accessLesson(req.user.id, courseId, lessonId);
  }

  /**
   * GET /progress/courses/:courseId
   * Get full progress summary for the authenticated student.
   */
  @Roles(Role.STUDENT)
  @Get('courses/:courseId')
  getCourseProgress(
    @Request() req: AuthRequest,
    @Param('courseId') courseId: string,
  ) {
    return this.progressService.getCourseProgress(req.user.id, courseId);
  }

  /**
   * GET /progress/courses/:courseId/lessons/:lessonId
   * Get single lesson completion status.
   */
  @Roles(Role.STUDENT)
  @Get('courses/:courseId/lessons/:lessonId')
  getLessonProgress(
    @Request() req: AuthRequest,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.getLessonProgress(
      req.user.id,
      courseId,
      lessonId,
    );
  }
}
