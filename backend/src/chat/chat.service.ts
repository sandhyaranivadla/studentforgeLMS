import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(courseId: string, senderId: string, content: string) {
    return this.prisma.message.create({
      data: {
        content,
        courseId,
        senderId,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async getMessagesByCourseId(courseId: string) {
    return this.prisma.message.findMany({
      where: { courseId },
      orderBy: { timestamp: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}
