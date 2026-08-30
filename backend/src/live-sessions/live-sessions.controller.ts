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
import { LiveSessionsService } from './live-sessions.service';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';
import { UpdateLiveSessionStatusDto } from './dto/live-session-status.dto';
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

@Controller('live-sessions')
export class LiveSessionsController {
  constructor(private readonly liveSessionsService: LiveSessionsService) {}

  /* ── Live Session CRUD ──────────────────────────────────────── */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Post('course/:courseId')
  createLiveSession(
    @Request() req: AuthRequest,
    @Param('courseId') courseId: string,
    @Body() createLiveSessionDto: CreateLiveSessionDto,
  ) {
    return this.liveSessionsService.createLiveSession(
      courseId,
      req.user.id,
      createLiveSessionDto,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('course/:courseId')
  findAllByCourse(
    @Request() req: AuthRequest,
    @Param('courseId') courseId: string,
  ) {
    return this.liveSessionsService.findAllByCourse(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.STUDENT)
  @Get('my-sessions')
  getMyUpcomingSessions(@Request() req: AuthRequest) {
    return this.liveSessionsService.findUpcomingForStudent(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Get('upcoming/list')
  getUpcoming(@Request() req: AuthRequest) {
    return this.liveSessionsService.findUpcoming(req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Get('past/list')
  getPast(@Request() req: AuthRequest) {
    return this.liveSessionsService.findPast(req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.liveSessionsService.findOne(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch(':id')
  updateLiveSession(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateLiveSessionDto: UpdateLiveSessionDto,
  ) {
    return this.liveSessionsService.updateLiveSession(
      id,
      req.user.id,
      updateLiveSessionDto,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Delete(':id')
  deleteLiveSession(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.liveSessionsService.deleteLiveSession(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateLiveSessionStatusDto,
  ) {
    return this.liveSessionsService.updateStatus(
      id,
      req.user.id,
      updateStatusDto,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch(':id/zoom-link')
  setZoomLink(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body('zoomMeetingId') zoomMeetingId: string,
  ) {
    return this.liveSessionsService.setZoomLink(
      id,
      req.user.id,
      zoomMeetingId,
      req.user.role,
    );
  }
}
