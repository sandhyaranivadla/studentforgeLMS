import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  userId: string;
  courseId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionUrl?: string;
}
