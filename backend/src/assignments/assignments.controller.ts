import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
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

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  /* ── Assignment CRUD ──────────────────────────────────────── */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Post()
  createAssignment(
    @Request() req: AuthRequest,
    @Body() createAssignmentDto: CreateAssignmentDto,
    @Query('courseId') courseId: string,
  ) {
    return this.assignmentsService.createAssignment(
      courseId,
      req.user.id,
      createAssignmentDto,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAllByCourse(
    @Request() req: AuthRequest,
    @Query('courseId') courseId: string,
  ) {
    return this.assignmentsService.findAllByCourse(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.assignmentsService.findOne(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch(':id')
  updateAssignment(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.updateAssignment(
      id,
      req.user.id,
      updateAssignmentDto,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Delete(':id')
  deleteAssignment(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.assignmentsService.deleteAssignment(
      id,
      req.user.id,
      req.user.role,
    );
  }

  /* ── Submission CRUD ──────────────────────────────────────── */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Post(':assignmentId/submit')
  submitAssignment(
    @Request() req: AuthRequest,
    @Param('assignmentId') assignmentId: string,
    @Body() createSubmissionDto: CreateSubmissionDto,
  ) {
    return this.assignmentsService.submitAssignment(
      assignmentId,
      req.user.id,
      createSubmissionDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Get(':assignmentId/submissions')
  getSubmissions(
    @Request() req: AuthRequest,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.assignmentsService.getSubmissions(
      assignmentId,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('submissions/:submissionId')
  getSubmission(
    @Request() req: AuthRequest,
    @Param('submissionId') submissionId: string,
  ) {
    return this.assignmentsService.getSubmission(
      submissionId,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Get('student/my-submissions')
  getMySubmissions(@Request() req: AuthRequest) {
    return this.assignmentsService.getMySubmissions(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch('submissions/:submissionId/grade')
  gradeSubmission(
    @Request() req: AuthRequest,
    @Param('submissionId') submissionId: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
  ) {
    return this.assignmentsService.gradeSubmission(
      submissionId,
      req.user.id,
      updateSubmissionDto,
      req.user.role,
    );
  }
}
