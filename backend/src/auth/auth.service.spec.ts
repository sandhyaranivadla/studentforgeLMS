import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockPrismaService = {
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('test-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
      });
      await expect(
        service.register(
          'test@test.com',
          'password123',
          'Test User',
          'STUDENT',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should return token on successful registration', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        email: 'new@test.com',
        name: 'New User',
        role: 'STUDENT',
        passwordHash: 'hashed',
      });
      const result = await service.register(
        'new@test.com',
        'password123',
        'New User',
        'STUDENT',
      );
      expect(result).toHaveProperty('access_token');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      await expect(service.login('no@user.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        passwordHash: await bcrypt.hash('correctpassword', 10),
        role: 'STUDENT',
      });
      await expect(
        service.login('test@test.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return token on successful login', async () => {
      const hash = await bcrypt.hash('password123', 10);
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        passwordHash: hash,
        role: 'STUDENT',
      });
      const result = await service.login('test@test.com', 'password123');
      expect(result).toHaveProperty('access_token');
      expect(result.user.role).toBe('STUDENT');
    });
  });
});
