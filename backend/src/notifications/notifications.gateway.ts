import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationResponseDto } from './dto/notification-response.dto';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private jwtService: JwtService) {}

  /**
   * Handle new Socket.io connection
   * Validates JWT token and joins user-specific room
   */
  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        this.logger.warn(`Connection attempt without token from ${socket.id}`);
        socket.disconnect();
        return;
      }

      // Verify JWT token using existing JwtService
      const payload = this.jwtService.verify(token);

      // Store user data on socket
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      socket.data.email = payload.email;

      // Join user-specific room for targeted notifications
      socket.join(`user_${payload.sub}`);

      this.logger.log(
        `User ${payload.sub} (${payload.role}) connected to notifications. Socket ID: ${socket.id}`,
      );
    } catch (error) {
      this.logger.warn(
        `Connection rejected: ${error instanceof Error ? error.message : 'Invalid token'}. Socket ID: ${socket.id}`,
      );
      socket.disconnect();
    }
  }

  /**
   * Handle Socket.io disconnection
   */
  handleDisconnect(socket: Socket) {
    this.logger.log(
      `User ${socket.data?.userId || 'unknown'} disconnected. Socket ID: ${socket.id}`,
    );
  }

  /**
   * Emit notification to specific user
   * Called by NotificationService after creating notification
   * Only sends to user's room - other users don't receive it
   */
  emitToUser(userId: string, notification: NotificationResponseDto) {
    try {
      this.server.to(`user_${userId}`).emit('notification:new', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedEntityId: notification.relatedEntityId,
        relatedEntityType: notification.relatedEntityType,
        actionUrl: notification.actionUrl,
        read: notification.read,
        createdAt: notification.createdAt,
      });

      this.logger.debug(`Notification emitted to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to emit notification to user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Emit unread count update to user
   * Called after marking as read or deleting notifications
   */
  emitUnreadCountUpdate(userId: string, unreadCount: number) {
    try {
      this.server
        .to(`user_${userId}`)
        .emit('unread-count:update', { unreadCount });

      this.logger.debug(
        `Unread count update emitted to user ${userId}: ${unreadCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to emit unread count to user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Optional: Health check endpoint for clients
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() socket: Socket): Record<string, any> {
    return { pong: true };
  }

  /**
   * Get server instance for access outside gateway
   * Used by NotificationService to emit events
   */
  getServer(): Server {
    return this.server;
  }
}
