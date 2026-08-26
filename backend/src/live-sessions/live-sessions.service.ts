import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LiveSessionsService {
  constructor(private prisma: PrismaService) {}

  create(createLiveSessionDto: CreateLiveSessionDto) {
    return this.prisma.liveSession.create({
      data: {
        courseId: createLiveSessionDto.courseId,
        title: createLiveSessionDto.title,
        startTime: new Date(createLiveSessionDto.startTime),
      },
    });
  }

  findAllByCourse(courseId: string) {
    return this.prisma.liveSession.findMany({
      where: { courseId },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: { course: true }
    });
    if (!session) throw new NotFoundException('Live session not found');
    return session;
  }

  update(id: string, updateLiveSessionDto: UpdateLiveSessionDto) {
    return this.prisma.liveSession.update({
      where: { id },
      data: {
        ...updateLiveSessionDto,
        startTime: updateLiveSessionDto.startTime ? new Date(updateLiveSessionDto.startTime) : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.liveSession.delete({
      where: { id },
    });
  }
}
