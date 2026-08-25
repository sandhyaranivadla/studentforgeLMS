import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.register on POST /auth/register', async () => {
    mockAuthService.register.mockResolvedValue({
      access_token: 'token',
      user: {},
    });
    await controller.register({
      email: 'a@b.com',
      password: 'pass123',
      name: 'Test',
    });
    expect(mockAuthService.register).toHaveBeenCalledWith(
      'a@b.com',
      'pass123',
      'Test',
      'STUDENT',
    );
  });

  it('should call authService.login on POST /auth/login', async () => {
    mockAuthService.login.mockResolvedValue({
      access_token: 'token',
      user: {},
    });
    await controller.login({ email: 'a@b.com', password: 'pass123' });
    expect(mockAuthService.login).toHaveBeenCalledWith('a@b.com', 'pass123');
  });

  it('should return current user from GET /auth/me', () => {
    const req = {
      user: { id: '1', email: 'a@b.com', role: 'STUDENT' as const },
    } as Parameters<typeof controller.getProfile>[0];
    const result = controller.getProfile(req);
    expect(result).toEqual({ id: '1', email: 'a@b.com', role: 'STUDENT' });
  });
});
