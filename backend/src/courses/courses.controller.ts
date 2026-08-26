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
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';
import {
  CreateModuleDto,
  UpdateModuleDto,
  CreateLessonDto,
  UpdateLessonDto,
} from './dto/module-lesson.dto';
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

interface OptionalAuthRequest extends ExpressRequest {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Post()
  createCourse(
    @Request() req: AuthRequest,
    @Body() createCourseDto: CreateCourseDto,
  ) {
    return this.coursesService.createCourse(
      req.user.id,
      createCourseDto,
      req.user.role,
    );
  }

  @Get()
  findAll(@Request() req: OptionalAuthRequest) {
    return this.coursesService.findAll(req.user?.role, req.user?.id);
  }

  @Get(':id')
  findOne(@Request() req: OptionalAuthRequest, @Param('id') id: string) {
    return this.coursesService.findOne(id, req.user?.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch(':id')
  updateCourse(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.updateCourse(
      id,
      req.user.id,
      updateCourseDto,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Delete(':id')
  removeCourse(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.coursesService.removeCourse(id, req.user.id, req.user.role);
  }

  // Modules
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Post(':id/modules')
  createModule(
    @Request() req: AuthRequest,
    @Param('id') courseId: string,
    @Body() createModuleDto: CreateModuleDto,
  ) {
    return this.coursesService.createModule(
      courseId,
      req.user.id,
      createModuleDto,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch('modules/:id')
  updateModule(
    @Request() req: AuthRequest,
    @Param('id') moduleId: string,
    @Body() updateModuleDto: UpdateModuleDto,
  ) {
    return this.coursesService.updateModule(
      moduleId,
      req.user.id,
      updateModuleDto,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Delete('modules/:id')
  removeModule(@Request() req: AuthRequest, @Param('id') moduleId: string) {
    return this.coursesService.removeModule(
      moduleId,
      req.user.id,
      req.user.role,
    );
  }

  // Lessons
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Post('modules/:id/lessons')
  createLesson(
    @Request() req: AuthRequest,
    @Param('id') moduleId: string,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    return this.coursesService.createLesson(
      moduleId,
      req.user.id,
      createLessonDto,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch('lessons/:id')
  updateLesson(
    @Request() req: AuthRequest,
    @Param('id') lessonId: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.coursesService.updateLesson(
      lessonId,
      req.user.id,
      updateLessonDto,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Delete('lessons/:id')
  removeLesson(@Request() req: AuthRequest, @Param('id') lessonId: string) {
    return this.coursesService.removeLesson(
      lessonId,
      req.user.id,
      req.user.role,
    );
  }
}
