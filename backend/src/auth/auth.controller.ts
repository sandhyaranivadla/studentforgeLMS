import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

interface AuthRequest extends Request {
  user: { id: string; email: string; role: Role };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    // Allow STUDENT and INSTRUCTOR self-registration
    // ADMIN accounts must be created via admin/setup
    const role = body.role || Role.STUDENT;
    
    if (role === Role.ADMIN) {
      throw new UnauthorizedException('Admin accounts must be created by administrators');
    }
    
    return this.authService.register(
      body.email,
      body.password,
      body.name,
      role,
    );
  }

  @Post('admin/setup')
  async adminSetup(@Body() body: RegisterDto) {
    // Allow creating the first admin with no auth required
    // After that, only existing admins can create new admins
    return this.authService.adminSetup(body.email, body.password, body.name);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: AuthRequest) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout() {
    // With stateless JWT, logout is handled client-side by deleting the token.
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin-only')
  adminOnly() {
    return { message: 'Welcome Admin' };
  }
}
