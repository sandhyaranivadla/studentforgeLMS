import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { LiveSessionsService } from './live-sessions.service';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('live-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LiveSessionsController {
  constructor(private readonly liveSessionsService: LiveSessionsService) {}

  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @Post()
  create(@Body() createLiveSessionDto: CreateLiveSessionDto) {
    return this.liveSessionsService.create(createLiveSessionDto);
  }

  @Get()
  findAllByCourse(@Query('courseId') courseId: string) {
    return this.liveSessionsService.findAllByCourse(courseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.liveSessionsService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLiveSessionDto: UpdateLiveSessionDto) {
    return this.liveSessionsService.update(id, updateLiveSessionDto);
  }

  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.liveSessionsService.remove(id);
  }
}
