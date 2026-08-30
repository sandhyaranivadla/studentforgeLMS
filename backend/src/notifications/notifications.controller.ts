import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetNotificationsResponseDto } from './dto/notification-response.dto';
import { Role } from '@prisma/client';
import type { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  /**
   * GET /notifications/unread-count
   * Get unread notification count for badge display
   * Must be BEFORE generic @Get() to avoid route collision
   */
  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  async getUnreadCount(
    @Request() req: AuthRequest,
  ): Promise<{ unreadCount: number }> {
    try {
      const unreadCount = await this.notificationsService.getUnreadCount(
        req.user.id,
      );
      return { unreadCount };
    } catch (error) {
      console.error('[NotificationsController.getUnreadCount] Error:', error);
      throw error;
    }
  }

  /**
   * GET /notifications
   * Get paginated notifications for authenticated user
   * Query params: page (default 1), limit (default 20, max 100)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getNotifications(
    @Request() req: AuthRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<GetNotificationsResponseDto> {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 20;

      return this.notificationsService.getNotifications(
        req.user.id,
        isNaN(pageNum) ? 1 : pageNum,
        isNaN(limitNum) ? 20 : limitNum,
      );
    } catch (error) {
      console.error('[NotificationsController.getNotifications] Error:', error);
      throw error;
    }
  }

  /**
   * PATCH /notifications/:id/read
   * Mark single notification as read
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  /**
   * PATCH /notifications/read-all
   * Mark all notifications as read for user
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(
    @Request() req: AuthRequest,
  ): Promise<{ updated: number }> {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  /**
   * DELETE /notifications/:id
   * Delete single notification
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(
    @Request() req: AuthRequest,
    @Param('id') id: string,
  ) {
    await this.notificationsService.deleteNotification(id, req.user.id);
  }

  /**
   * DELETE /notifications
   * Delete all notifications for user
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteAllNotifications(
    @Request() req: AuthRequest,
  ): Promise<{ deleted: number }> {
    return this.notificationsService.deleteAllNotifications(req.user.id);
  }
}
