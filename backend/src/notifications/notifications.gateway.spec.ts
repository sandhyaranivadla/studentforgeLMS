import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsGateway } from './notifications.gateway';
import { JwtService } from '@nestjs/jwt';
import { NotificationResponseDto } from './dto/notification-response.dto';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let jwtService: JwtService;

  const mockJwtPayload = {
    sub: 'user-1',
    email: 'test@example.com',
    role: 'STUDENT',
  };

  const mockSocket = {
    id: 'socket-1',
    handshake: {
      auth: {
        token: 'valid-token',
      },
    },
    data: {},
    disconnect: jest.fn(),
    join: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  } as any;

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    jwtService = module.get<JwtService>(JwtService);

    // Set mock server
    gateway.server = mockServer;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should connect socket with valid token', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.data.userId).toBe('user-1');
      expect(mockSocket.data.role).toBe('STUDENT');
      expect(mockSocket.data.email).toBe('test@example.com');
      expect(mockSocket.join).toHaveBeenCalledWith('user_user-1');
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect socket without token', async () => {
      const socketNoToken = { ...mockSocket, handshake: { auth: {} } };

      await gateway.handleConnection(socketNoToken);

      expect(socketNoToken.disconnect).toHaveBeenCalled();
    });

    it('should disconnect socket with invalid token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect socket with expired token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Token expired');
      });

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle disconnection', () => {
      mockSocket.data.userId = 'user-1';

      expect(() => gateway.handleDisconnect(mockSocket)).not.toThrow();
    });

    it('should handle disconnection with no user data', () => {
      const socketNoData = { ...mockSocket, data: {} };

      expect(() => gateway.handleDisconnect(socketNoData)).not.toThrow();
    });
  });

  describe('emitToUser', () => {
    it('should emit notification to user room only', () => {
      const mockNotification: NotificationResponseDto = {
        id: 'notif-1',
        type: 'ASSIGNMENT_SUBMITTED',
        title: 'Test',
        message: 'Test message',
        read: false,
        readAt: null,
        courseId: 'course-1',
        relatedEntityId: 'assignment-1',
        relatedEntityType: 'ASSIGNMENT',
        actionUrl: '/dashboard/assignments/1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      gateway.emitToUser('user-1', mockNotification);

      expect(mockServer.to).toHaveBeenCalledWith('user_user-1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'notification:new',
        expect.objectContaining({
          id: 'notif-1',
          type: 'ASSIGNMENT_SUBMITTED',
          title: 'Test',
          message: 'Test message',
        }),
      );
    });

    it('should not emit to other user rooms', () => {
      const mockNotification: NotificationResponseDto = {
        id: 'notif-1',
        type: 'ASSIGNMENT_SUBMITTED',
        title: 'Test',
        message: 'Test message',
        read: false,
        readAt: null,
        courseId: 'course-1',
        relatedEntityId: 'assignment-1',
        relatedEntityType: 'ASSIGNMENT',
        actionUrl: '/dashboard/assignments/1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      gateway.emitToUser('user-1', mockNotification);

      // Verify it only targets user_user-1
      expect(mockServer.to).toHaveBeenCalledWith('user_user-1');
      expect(mockServer.to).not.toHaveBeenCalledWith('user_user-2');
      expect(mockServer.to).not.toHaveBeenCalledWith('broadcast');
    });
  });

  describe('emitUnreadCountUpdate', () => {
    it('should emit unread count to user room', () => {
      gateway.emitUnreadCountUpdate('user-1', 5);

      expect(mockServer.to).toHaveBeenCalledWith('user_user-1');
      expect(mockServer.emit).toHaveBeenCalledWith('unread-count:update', {
        unreadCount: 5,
      });
    });

    it('should emit zero unread count', () => {
      gateway.emitUnreadCountUpdate('user-1', 0);

      expect(mockServer.emit).toHaveBeenCalledWith('unread-count:update', {
        unreadCount: 0,
      });
    });
  });

  describe('handlePing', () => {
    it('should respond to ping', () => {
      const result = gateway.handlePing(mockSocket);

      expect(result).toEqual({ pong: true });
    });
  });

  describe('getServer', () => {
    it('should return server instance', () => {
      const server = gateway.getServer();

      expect(server).toBe(mockServer);
    });
  });

  describe('Socket.io security isolation', () => {
    it('should prevent cross-user notification access', () => {
      // User 1 notification
      const mockNotif1: NotificationResponseDto = {
        id: 'notif-1',
        type: 'ASSIGNMENT_SUBMITTED',
        title: 'Test',
        message: 'Test message',
        read: false,
        readAt: null,
        courseId: 'course-1',
        relatedEntityId: 'assignment-1',
        relatedEntityType: 'ASSIGNMENT',
        actionUrl: '/dashboard/assignments/1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      gateway.emitToUser('user-1', mockNotif1);

      // Verify only user_user-1 room targeted
      expect(mockServer.to).toHaveBeenCalledWith('user_user-1');

      // Reset mocks
      jest.clearAllMocks();

      // User 2 notification
      gateway.emitToUser('user-2', mockNotif1);

      // Verify only user_user-2 room targeted
      expect(mockServer.to).toHaveBeenCalledWith('user_user-2');
    });

    it('should not allow manual room joining', async () => {
      const socketAttemptingBypass = {
        ...mockSocket,
        handshake: {
          auth: {
            token: 'valid-token',
          },
        },
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);

      await gateway.handleConnection(socketAttemptingBypass);

      // Should only join the authenticated user's room
      expect(socketAttemptingBypass.join).toHaveBeenCalledWith('user_user-1');
      expect(socketAttemptingBypass.join).toHaveBeenCalledTimes(1);
    });
  });
});
