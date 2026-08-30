import { Notification } from '@prisma/client';

export class NotificationResponseDto {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt: Date | null;
  courseId: string;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
  actionUrl: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(notification: Notification) {
    this.id = notification.id;
    this.type = notification.type;
    this.title = notification.title;
    this.message = notification.message;
    this.read = notification.read;
    this.readAt = notification.readAt;
    this.courseId = notification.courseId;
    this.relatedEntityId = notification.relatedEntityId;
    this.relatedEntityType = notification.relatedEntityType;
    this.actionUrl = notification.actionUrl;
    this.createdAt = notification.createdAt;
    this.updatedAt = notification.updatedAt;
  }
}

export class GetNotificationsResponseDto {
  data: NotificationResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
