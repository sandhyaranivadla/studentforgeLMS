import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
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

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTRUCTOR, Role.ADMIN)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  /**
   * GET /analytics/courses/:courseId/overview
   * Returns course health snapshot
   */
  @Get('courses/:courseId/overview')
  @HttpCode(HttpStatus.OK)
  async getCourseOverview(
    @Param('courseId') courseId: string,
    @Request() req: AuthRequest,
  ) {
    return this.analyticsService.getCourseOverview(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * GET /analytics/courses/:courseId/students
   * Returns all enrolled students with progress
   */
  @Get('courses/:courseId/students')
  @HttpCode(HttpStatus.OK)
  async getEnrolledStudents(
    @Param('courseId') courseId: string,
    @Request() req: AuthRequest,
  ) {
    return this.analyticsService.getEnrolledStudents(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * GET /analytics/courses/:courseId/students/:studentId
   * Returns single student detailed view
   */
  @Get('courses/:courseId/students/:studentId')
  @HttpCode(HttpStatus.OK)
  async getStudentDashboard(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Request() req: AuthRequest,
  ) {
    return this.analyticsService.getStudentDashboard(
      courseId,
      studentId,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * GET /analytics/courses/:courseId/assignments
   * Returns assignment submission stats
   */
  @Get('courses/:courseId/assignments')
  @HttpCode(HttpStatus.OK)
  async getAssignmentStats(
    @Param('courseId') courseId: string,
    @Request() req: AuthRequest,
  ) {
    return this.analyticsService.getAssignmentStats(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * GET /analytics/courses/:courseId/quizzes
   * Returns quiz attempt stats
   */
  @Get('courses/:courseId/quizzes')
  @HttpCode(HttpStatus.OK)
  async getQuizStats(
    @Param('courseId') courseId: string,
    @Request() req: AuthRequest,
  ) {
    return this.analyticsService.getQuizStats(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * GET /analytics/courses/:courseId/lessons
   * Returns lesson completion rates
   */
  @Get('courses/:courseId/lessons')
  @HttpCode(HttpStatus.OK)
  async getLessonStats(
    @Param('courseId') courseId: string,
    @Request() req: AuthRequest,
  ) {
    return this.analyticsService.getLessonStats(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * GET /analytics/courses/:courseId/live-sessions
   * Returns live session stats
   */
  @Get('courses/:courseId/live-sessions')
  @HttpCode(HttpStatus.OK)
  async getLiveSessionStats(
    @Param('courseId') courseId: string,
    @Request() req: AuthRequest,
  ) {
    return this.analyticsService.getLiveSessionStats(
      courseId,
      req.user.id,
      req.user.role,
    );
  }
}
