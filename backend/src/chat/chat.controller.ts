import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':courseId/messages')
  async getCourseMessages(@Param('courseId') courseId: string) {
    return this.chatService.getMessagesByCourseId(courseId);
  }
}
