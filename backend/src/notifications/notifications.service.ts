import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationResponseDto,
  GetNotificationsResponseDto,
} from './dto/notification-response.dto';
import { NotificationType } from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  /**
   * Create a notification and persist to database
   * Database is source of truth - all notifications persisted immediately
   * Then emits via Socket.io to connected clients
   */
  async createNotification(
    userId: string,
    courseId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedEntityId?: string,
    relatedEntityType?: string,
    actionUrl?: string,
  ) {
    // Validate required fields
    if (!userId || !courseId || !type || !title || !message) {
      throw new BadRequestException('Missing required notification fields');
    }

    // Validate type is valid NotificationType
    if (!Object.values(NotificationType).includes(type)) {
      throw new BadRequestException(`Invalid notification type: ${type}`);
    }

    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }

    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          courseId,
          type,
          title,
          message,
          relatedEntityId: relatedEntityId || null,
          relatedEntityType: relatedEntityType || null,
          actionUrl: actionUrl || null,
        },
      });

      const responseDto = new NotificationResponseDto(notification);

      // Emit to connected client via Socket.io
      // If client is offline, notification remains in DB and will be retrieved on reconnect
      this.gateway.emitToUser(userId, responseDto);

      // Emit unread count update
      const unreadCount = await this.getUnreadCount(userId);
      this.gateway.emitUnreadCountUpdate(userId, unreadCount);

      this.logger.debug(`Notification created and emitted for user ${userId}`);

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadRequestException(
        `Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get paginated notifications for authenticated user
   * Enforces userId - user can only retrieve their own notifications
   */
  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<GetNotificationsResponseDto> {
    if (limit > 100) {
      limit = 100; // Cap at 100
    }

    if (page < 1) {
      page = 1;
    }

    const skip = (page - 1) * limit;

    try {
      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where: { userId }, // Only this user's notifications
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.notification.count({
          where: { userId },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: notifications.map((n) => new NotificationResponseDto(n)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch notifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get unread notification count for user (for badge)
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await this.prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      });
      return count;
    } catch (error) {
      throw new BadRequestException(
        `Failed to get unread count: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    // Verify notification exists and belongs to user
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only mark your own notifications as read',
      );
    }

    try {
      const updated = await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      // Emit unread count update via Socket.io
      const unreadCount = await this.getUnreadCount(userId);
      this.gateway.emitUnreadCountUpdate(userId, unreadCount);

      return new NotificationResponseDto(updated);
    } catch (error) {
      throw new BadRequestException(
        `Failed to mark notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      // Emit unread count update (0) via Socket.io
      this.gateway.emitUnreadCountUpdate(userId, 0);

      return { updated: result.count };
    } catch (error) {
      throw new BadRequestException(
        `Failed to mark all as read: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete single notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    // Verify notification exists and belongs to user
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own notifications',
      );
    }

    try {
      const deleted = await this.prisma.notification.delete({
        where: { id: notificationId },
      });

      return new NotificationResponseDto(deleted);
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete all notifications for user
   */
  async deleteAllNotifications(userId: string): Promise<{ deleted: number }> {
    try {
      const result = await this.prisma.notification.deleteMany({
        where: { userId },
      });

      return { deleted: result.count };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete notifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get unread count and return as emittable response for Socket.io
   */
  async getUnreadCountResponse(
    userId: string,
  ): Promise<{ unreadCount: number }> {
    const unreadCount = await this.getUnreadCount(userId);
    return { unreadCount };
  }
}
