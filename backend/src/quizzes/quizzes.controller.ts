import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { CreateQuizOptionDto } from './dto/create-quiz-option.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  /* ── Quiz CRUD ──────────────────────────────────────── */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Post()
  createQuiz(
    @Request() req: AuthRequest,
    @Body() createQuizDto: CreateQuizDto,
    @Query('courseId') courseId: string,
  ) {
    return this.quizzesService.createQuiz(
      courseId,
      req.user.id,
      createQuizDto,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAllByCourse(
    @Request() req: AuthRequest,
    @Query('courseId') courseId: string,
  ) {
    return this.quizzesService.findAllByCourse(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.quizzesService.findOne(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch(':id')
  updateQuiz(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ) {
    return this.quizzesService.updateQuiz(
      id,
      req.user.id,
      updateQuizDto,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Delete(':id')
  deleteQuiz(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.quizzesService.deleteQuiz(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch(':id/publish')
  publishQuiz(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.quizzesService.publishQuiz(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch(':id/unpublish')
  unpublishQuiz(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.quizzesService.unpublishQuiz(id, req.user.id, req.user.role);
  }

  /* ── Quiz Questions ──────────────────────────────────────── */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Post(':quizId/questions')
  addQuestion(
    @Request() req: AuthRequest,
    @Param('quizId') quizId: string,
    @Body() createQuestionDto: CreateQuizQuestionDto,
  ) {
    return this.quizzesService.addQuestion(
      quizId,
      req.user.id,
      createQuestionDto,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':quizId/questions')
  getQuestions(@Request() req: AuthRequest, @Param('quizId') quizId: string) {
    return this.quizzesService.getQuestions(quizId, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch('questions/:questionId')
  updateQuestion(
    @Request() req: AuthRequest,
    @Param('questionId') questionId: string,
    @Body() updateData: Partial<CreateQuizQuestionDto>,
  ) {
    return this.quizzesService.updateQuestion(
      questionId,
      req.user.id,
      updateData,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Delete('questions/:questionId')
  deleteQuestion(
    @Request() req: AuthRequest,
    @Param('questionId') questionId: string,
  ) {
    return this.quizzesService.deleteQuestion(
      questionId,
      req.user.id,
      req.user.role,
    );
  }

  /* ── Quiz Options ──────────────────────────────────────── */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Post('questions/:questionId/options')
  addOption(
    @Request() req: AuthRequest,
    @Param('questionId') questionId: string,
    @Body() createOptionDto: CreateQuizOptionDto,
  ) {
    return this.quizzesService.addOption(
      questionId,
      req.user.id,
      createOptionDto,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Patch('options/:optionId')
  updateOption(
    @Request() req: AuthRequest,
    @Param('optionId') optionId: string,
    @Body() updateData: Partial<CreateQuizOptionDto>,
  ) {
    return this.quizzesService.updateOption(
      optionId,
      req.user.id,
      updateData,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Delete('options/:optionId')
  deleteOption(
    @Request() req: AuthRequest,
    @Param('optionId') optionId: string,
  ) {
    return this.quizzesService.deleteOption(
      optionId,
      req.user.id,
      req.user.role,
    );
  }

  /* ── Quiz Results/Attempts ──────────────────────────────────────── */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Get(':quizId/attempts')
  getAttempts(@Request() req: AuthRequest, @Param('quizId') quizId: string) {
    return this.quizzesService.getAttempts(quizId, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Get('attempts/:attemptId')
  getAttempt(
    @Request() req: AuthRequest,
    @Param('attemptId') attemptId: string,
  ) {
    return this.quizzesService.getAttempt(
      attemptId,
      req.user.id,
      req.user.role,
    );
  }
}
