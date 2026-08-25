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
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import {
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
} from './dto/create-enrollment.dto';
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

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Roles(Role.STUDENT)
  @Post()
  create(
    @Request() req: AuthRequest,
    @Body() createEnrollmentDto: CreateEnrollmentDto,
  ) {
    return this.enrollmentsService.create(req.user.id, createEnrollmentDto);
  }

  @Roles(Role.STUDENT)
  @Get('check/:courseId')
  checkEnrollment(
    @Request() req: AuthRequest,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollmentsService.checkEnrollment(req.user.id, courseId);
  }

  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.enrollmentsService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.enrollmentsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentsService.update(
      id,
      req.user.id,
      updateEnrollmentDto,
      req.user.role,
    );
  }

  @Delete(':id')
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.enrollmentsService.remove(id, req.user.id, req.user.role);
  }
}
