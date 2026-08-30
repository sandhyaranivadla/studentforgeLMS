import { Module } from '@nestjs/common';
import { LiveSessionsService } from './live-sessions.service';
import { LiveSessionsController } from './live-sessions.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ZoomService } from './zoom.service';

@Module({
  controllers: [LiveSessionsController],
  providers: [LiveSessionsService, ZoomService, PrismaService],
})
export class LiveSessionsModule {}
