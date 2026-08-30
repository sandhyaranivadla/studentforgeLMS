import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import {
  CalendarEventsResponseDto,
  CalendarQueryDto,
  CalendarEventDto,
} from './dto/calendar-event.dto';
import type { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('calendar')
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  /**
   * GET /calendar
   * Get calendar events for a date range
   * Query params: startDate (ISO 8601), endDate (ISO 8601), courseId (optional)
   * Returns normalized calendar events from all sources
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Get()
  @HttpCode(HttpStatus.OK)
  async getCalendarEvents(
    @Request() req: AuthRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('courseId') courseId?: string,
  ): Promise<CalendarEventsResponseDto> {
    const query: CalendarQueryDto = {
      startDate,
      endDate,
      courseId,
    };

    return this.calendarService.getCalendarEvents(
      req.user.id,
      req.user.role,
      query,
    );
  }

  /**
   * GET /calendar/:date
   * Get calendar events for a specific date
   * Param: date (ISO 8601 format, e.g., 2024-01-15)
   * Returns events for that day only
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Get(':date')
  @HttpCode(HttpStatus.OK)
  async getCalendarEventsByDate(
    @Request() req: AuthRequest,
    @Query('date') date: string,
  ): Promise<CalendarEventDto[]> {
    return this.calendarService.getCalendarEventsByDate(
      req.user.id,
      req.user.role,
      date,
    );
  }
}
