import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let gateway: NotificationsGateway;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    courseId: 'course-1',
    type: NotificationType.ASSIGNMENT_SUBMITTED,
    title: 'Test Notification',
    message: 'Test message',
    read: false,
    readAt: null,
    relatedEntityId: 'assignment-1',
    relatedEntityType: 'ASSIGNMENT',
    actionUrl: '/dashboard/assignments/1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCourse = {
    id: 'course-1',
    title: 'Test Course',
    description: 'Test',
    price: 0,
    instructorId: 'instructor-1',
    published: true,
    thumbnail: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            course: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: NotificationsGateway,
          useValue: {
            emitToUser: jest.fn(),
            emitUnreadCountUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    gateway = module.get<NotificationsGateway>(NotificationsGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      jest.spyOn(prisma.course, 'findUnique').mockResolvedValue(mockCourse);
      jest
        .spyOn(prisma.notification, 'create')
        .mockResolvedValue(mockNotification);
      jest.spyOn(prisma.notification, 'count').mockResolvedValue(0);

      const result = await service.createNotification(
        'user-1',
        'course-1',
        NotificationType.ASSIGNMENT_SUBMITTED,
        'Test Notification',
        'Test message',
        'assignment-1',
        'ASSIGNMENT',
        '/dashboard/assignments/1',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('notif-1');
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(gateway.emitToUser).toHaveBeenCalled();
      expect(gateway.emitUnreadCountUpdate).toHaveBeenCalled();
    });

    it('should throw BadRequestException for missing fields', async () => {
      await expect(
        service.createNotification(
          '',
          'course-1',
          NotificationType.ASSIGNMENT_SUBMITTED,
          '',
          'message',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if course does not exist', async () => {
      jest.spyOn(prisma.course, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createNotification(
          'user-1',
          'invalid-course',
          NotificationType.ASSIGNMENT_SUBMITTED,
          'Title',
          'Message',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid notification type', async () => {
      await expect(
        service.createNotification(
          'user-1',
          'course-1',
          'INVALID_TYPE' as any,
          'Title',
          'Message',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications for user', async () => {
      const mockNotifications = [mockNotification];
      jest
        .spyOn(prisma.notification, 'findMany')
        .mockResolvedValue(mockNotifications);
      jest.spyOn(prisma.notification, 'count').mockResolvedValue(1);

      const result = await service.getNotifications('user-1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );
    });

    it('should enforce userId - only return own notifications', async () => {
      jest.spyOn(prisma.notification, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.notification, 'count').mockResolvedValue(0);

      await service.getNotifications('user-1', 1, 20);

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );
    });

    it('should cap limit at 100', async () => {
      jest.spyOn(prisma.notification, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.notification, 'count').mockResolvedValue(0);

      await service.getNotifications('user-1', 1, 200);

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      jest.spyOn(prisma.notification, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.notification, 'count').mockResolvedValue(50);

      const result = await service.getNotifications('user-1', 2, 20);

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (2 - 1) * 20
        }),
      );
      expect(result.pagination.totalPages).toBe(3); // ceil(50 / 20)
    });
  });

  describe('getUnreadCount', () => {
    it('should return correct unread count', async () => {
      jest.spyOn(prisma.notification, 'count').mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(prisma.notification.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', read: false },
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      jest
        .spyOn(prisma.notification, 'findUnique')
        .mockResolvedValue(mockNotification);
      const readNotification = {
        ...mockNotification,
        read: true,
        readAt: new Date(),
      };
      jest
        .spyOn(prisma.notification, 'update')
        .mockResolvedValue(readNotification);
      jest.spyOn(prisma.notification, 'count').mockResolvedValue(0);

      const result = await service.markAsRead('notif-1', 'user-1');

      expect(result.read).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1' },
          data: expect.objectContaining({
            read: true,
            readAt: expect.any(Date),
          }),
        }),
      );
      expect(gateway.emitUnreadCountUpdate).toHaveBeenCalled();
    });

    it('should throw NotFoundException if notification not found', async () => {
      jest.spyOn(prisma.notification, 'findUnique').mockResolvedValue(null);

      await expect(service.markAsRead('invalid-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if notification belongs to different user', async () => {
      jest
        .spyOn(prisma.notification, 'findUnique')
        .mockResolvedValue(mockNotification);

      await expect(
        service.markAsRead('notif-1', 'different-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      jest
        .spyOn(prisma.notification, 'updateMany')
        .mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user-1');

      expect(result.updated).toBe(5);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', read: false },
        }),
      );
      expect(gateway.emitUnreadCountUpdate).toHaveBeenCalledWith('user-1', 0);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      jest
        .spyOn(prisma.notification, 'findUnique')
        .mockResolvedValue(mockNotification);
      jest
        .spyOn(prisma.notification, 'delete')
        .mockResolvedValue(mockNotification);

      const result = await service.deleteNotification('notif-1', 'user-1');

      expect(result).toBeDefined();
      expect(prisma.notification.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1' },
        }),
      );
    });

    it('should throw ForbiddenException if not owner', async () => {
      jest
        .spyOn(prisma.notification, 'findUnique')
        .mockResolvedValue(mockNotification);

      await expect(
        service.deleteNotification('notif-1', 'different-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteAllNotifications', () => {
    it('should delete all notifications for user', async () => {
      jest
        .spyOn(prisma.notification, 'deleteMany')
        .mockResolvedValue({ count: 10 });

      const result = await service.deleteAllNotifications('user-1');

      expect(result.deleted).toBe(10);
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );
    });
  });

  describe('getUnreadCountResponse', () => {
    it('should return unread count in proper format', async () => {
      jest.spyOn(prisma.notification, 'count').mockResolvedValue(3);

      const result = await service.getUnreadCountResponse('user-1');

      expect(result).toEqual({ unreadCount: 3 });
    });
  });
});
