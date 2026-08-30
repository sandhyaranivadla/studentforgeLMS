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
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
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

@Controller('announcements')
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  /**
   * POST /announcements
   * Create a new announcement (instructor/admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: AuthRequest,
    @Body() createAnnouncementDto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.create(
      createAnnouncementDto.courseId,
      req.user.id,
      createAnnouncementDto,
      req.user.role,
    );
  }

  /**
   * GET /announcements?courseId=:courseId
   * Get all announcements for a course (instructor/admin only - sees all)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllByCourse(
    @Request() req: AuthRequest,
    @Query('courseId') courseId: string,
  ) {
    return this.announcementsService.findAllByCourse(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * GET /announcements/published?courseId=:courseId
   * Get published announcements for a course (students see only published)
   */
  @UseGuards(JwtAuthGuard)
  @Get('published')
  @HttpCode(HttpStatus.OK)
  async findPublishedByCourse(
    @Request() req: AuthRequest,
    @Query('courseId') courseId: string,
  ) {
    return this.announcementsService.findPublishedByCourse(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * GET /announcements/:id
   * Get a single announcement
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.announcementsService.findOne(id, req.user.id, req.user.role);
  }

  /**
   * PATCH /announcements/:id
   * Update an announcement (instructor/admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(
      id,
      req.user.id,
      updateAnnouncementDto,
      req.user.role,
    );
  }

  /**
   * DELETE /announcements/:id
   * Delete an announcement (instructor/admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.announcementsService.delete(id, req.user.id, req.user.role);
  }
}
