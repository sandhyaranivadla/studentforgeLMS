import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { CreateQuizOptionDto } from './dto/create-quiz-option.dto';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  /* ── Quiz CRUD ──────────────────────────────────────── */

  async createQuiz(
    courseId: string,
    userId: string,
    createQuizDto: CreateQuizDto,
    userRole: Role,
  ) {
    // Verify course exists and user is the owner
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only create quizzes for your own courses',
      );
    }

    // If moduleId provided, verify it belongs to this course
    if (createQuizDto.moduleId) {
      const module = await this.prisma.courseModule.findUnique({
        where: { id: createQuizDto.moduleId },
      });
      if (!module || module.courseId !== courseId) {
        throw new NotFoundException(
          'Module not found or does not belong to this course',
        );
      }
    }

    return this.prisma.quiz.create({
      data: {
        courseId,
        title: createQuizDto.title,
        description: createQuizDto.description || null,
        instructions: createQuizDto.instructions || null,
        timeLimit: createQuizDto.timeLimit || null,
        passingScore: createQuizDto.passingScore || null,
        showCorrectAnswers: createQuizDto.showCorrectAnswers ?? false,
        randomizeQuestions: createQuizDto.randomizeQuestions ?? false,
        moduleId: createQuizDto.moduleId || null,
      },
      include: {
        course: true,
        module: true,
        questions: {
          include: { options: true },
        },
        attempts: true,
      },
    });
  }

  async findAllByCourse(courseId: string, userId: string, userRole: Role) {
    // Verify course exists and user has access
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    // Instructors can only see their own courses - return empty if not owner
    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      return []; // Return empty array instead of throwing
    }

    return this.prisma.quiz.findMany({
      where: { courseId },
      include: {
        course: true,
        module: true,
        questions: {
          include: { options: true },
        },
        attempts: true,
      },
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        course: true,
        module: true,
        questions: {
          include: { options: true },
          orderBy: { orderIndex: 'asc' },
        },
        attempts: {
          include: {
            student: true,
            answers: {
              include: { selectedOption: true },
            },
          },
        },
      },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');

    // Instructors can only access their own quizzes - return 404 instead of 403
    if (userRole === Role.INSTRUCTOR && quiz.course.instructorId !== userId) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async updateQuiz(
    id: string,
    userId: string,
    updateQuizDto: UpdateQuizDto,
    userRole: Role,
  ) {
    // Verify quiz exists and user is the owner
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');

    if (userRole !== Role.ADMIN && quiz.course.instructorId !== userId) {
      throw new ForbiddenException('You can only update your own quizzes');
    }

    return this.prisma.quiz.update({
      where: { id },
      data: {
        title: updateQuizDto.title || undefined,
        description: updateQuizDto.description || undefined,
        instructions: updateQuizDto.instructions || undefined,
        timeLimit: updateQuizDto.timeLimit || undefined,
        passingScore: updateQuizDto.passingScore || undefined,
        showCorrectAnswers:
          updateQuizDto.showCorrectAnswers !== undefined
            ? updateQuizDto.showCorrectAnswers
            : undefined,
        randomizeQuestions:
          updateQuizDto.randomizeQuestions !== undefined
            ? updateQuizDto.randomizeQuestions
            : undefined,
      },
      include: {
        course: true,
        module: true,
        questions: {
          include: { options: true },
        },
        attempts: true,
      },
    });
  }

  async deleteQuiz(id: string, userId: string, userRole: Role) {
    // Verify quiz exists and user is the owner
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');

    if (userRole !== Role.ADMIN && quiz.course.instructorId !== userId) {
      throw new ForbiddenException('You can only delete your own quizzes');
    }

    // Delete all related data
    await this.prisma.studentQuizAnswer.deleteMany({
      where: {
        attempt: {
          quizId: id,
        },
      },
    });

    await this.prisma.quizAttempt.deleteMany({
      where: { quizId: id },
    });

    await this.prisma.quizOption.deleteMany({
      where: {
        question: {
          quizId: id,
        },
      },
    });

    await this.prisma.quizQuestion.deleteMany({
      where: { quizId: id },
    });

    return this.prisma.quiz.delete({
      where: { id },
    });
  }

  async publishQuiz(id: string, userId: string, userRole: Role) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');

    if (userRole !== Role.ADMIN && quiz.course.instructorId !== userId) {
      throw new ForbiddenException('You can only publish your own quizzes');
    }

    return this.prisma.quiz.update({
      where: { id },
      data: { published: true },
      include: {
        course: true,
        module: true,
        questions: {
          include: { options: true },
        },
        attempts: true,
      },
    });
  }

  async unpublishQuiz(id: string, userId: string, userRole: Role) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');

    if (userRole !== Role.ADMIN && quiz.course.instructorId !== userId) {
      throw new ForbiddenException('You can only unpublish your own quizzes');
    }

    return this.prisma.quiz.update({
      where: { id },
      data: { published: false },
      include: {
        course: true,
        module: true,
        questions: {
          include: { options: true },
        },
        attempts: true,
      },
    });
  }

  /* ── Quiz Question Management ──────────────────────────────────────── */

  async addQuestion(
    quizId: string,
    userId: string,
    createQuestionDto: CreateQuizQuestionDto,
    userRole: Role,
  ) {
    // Verify quiz exists and user is the owner
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: true },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');

    if (userRole !== Role.ADMIN && quiz.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only add questions to your own quizzes',
      );
    }

    // Get current max orderIndex
    const lastQuestion = await this.prisma.quizQuestion.findFirst({
      where: { quizId },
      orderBy: { orderIndex: 'desc' },
    });

    const orderIndex =
      createQuestionDto.orderIndex || (lastQuestion?.orderIndex || 0) + 1;

    return this.prisma.quizQuestion.create({
      data: {
        quizId,
        questionText: createQuestionDto.questionText,
        marks: createQuestionDto.marks || 1.0,
        orderIndex,
      },
      include: { options: true },
    });
  }

  async getQuestions(quizId: string, userId: string, userRole: Role) {
    // Verify quiz exists and user has access
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: true },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');

    if (userRole !== Role.ADMIN && quiz.course.instructorId !== userId) {
      throw new ForbiddenException('You do not have access to this quiz');
    }

    return this.prisma.quizQuestion.findMany({
      where: { quizId },
      include: { options: true },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async updateQuestion(
    questionId: string,
    userId: string,
    updateData: Partial<CreateQuizQuestionDto>,
    userRole: Role,
  ) {
    // Verify question exists and user is the owner
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: {
        quiz: {
          include: { course: true },
        },
      },
    });

    if (!question) throw new NotFoundException('Question not found');

    if (
      userRole !== Role.ADMIN &&
      question.quiz.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'You can only update your own quiz questions',
      );
    }

    return this.prisma.quizQuestion.update({
      where: { id: questionId },
      data: {
        questionText: updateData.questionText || undefined,
        marks: updateData.marks || undefined,
        orderIndex: updateData.orderIndex || undefined,
      },
      include: { options: true },
    });
  }

  async deleteQuestion(questionId: string, userId: string, userRole: Role) {
    // Verify question exists and user is the owner
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: {
        quiz: {
          include: { course: true },
        },
      },
    });

    if (!question) throw new NotFoundException('Question not found');

    if (
      userRole !== Role.ADMIN &&
      question.quiz.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'You can only delete your own quiz questions',
      );
    }

    // Delete related data
    await this.prisma.studentQuizAnswer.deleteMany({
      where: { questionId },
    });

    await this.prisma.quizOption.deleteMany({
      where: { questionId },
    });

    return this.prisma.quizQuestion.delete({
      where: { id: questionId },
    });
  }

  /* ── Quiz Option Management ──────────────────────────────────────── */

  async addOption(
    questionId: string,
    userId: string,
    createOptionDto: CreateQuizOptionDto,
    userRole: Role,
  ) {
    // Verify question exists and user is the owner
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: {
        quiz: {
          include: { course: true },
        },
      },
    });

    if (!question) throw new NotFoundException('Question not found');

    if (
      userRole !== Role.ADMIN &&
      question.quiz.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'You can only add options to your own quiz questions',
      );
    }

    // Get current max orderIndex
    const lastOption = await this.prisma.quizOption.findFirst({
      where: { questionId },
      orderBy: { orderIndex: 'desc' },
    });

    const orderIndex =
      createOptionDto.orderIndex || (lastOption?.orderIndex || 0) + 1;

    return this.prisma.quizOption.create({
      data: {
        questionId,
        optionText: createOptionDto.optionText,
        isCorrect: createOptionDto.isCorrect ?? false,
        orderIndex,
      },
    });
  }

  async updateOption(
    optionId: string,
    userId: string,
    updateData: Partial<CreateQuizOptionDto>,
    userRole: Role,
  ) {
    // Verify option exists and user is the owner
    const option = await this.prisma.quizOption.findUnique({
      where: { id: optionId },
      include: {
        question: {
          include: {
            quiz: {
              include: { course: true },
            },
          },
        },
      },
    });

    if (!option) throw new NotFoundException('Option not found');

    if (
      userRole !== Role.ADMIN &&
      option.question.quiz.course.instructorId !== userId
    ) {
      throw new ForbiddenException('You can only update your own quiz options');
    }

    return this.prisma.quizOption.update({
      where: { id: optionId },
      data: {
        optionText: updateData.optionText || undefined,
        isCorrect:
          updateData.isCorrect !== undefined ? updateData.isCorrect : undefined,
        orderIndex: updateData.orderIndex || undefined,
      },
    });
  }

  async deleteOption(optionId: string, userId: string, userRole: Role) {
    // Verify option exists and user is the owner
    const option = await this.prisma.quizOption.findUnique({
      where: { id: optionId },
      include: {
        question: {
          include: {
            quiz: {
              include: { course: true },
            },
          },
        },
      },
    });

    if (!option) throw new NotFoundException('Option not found');

    if (
      userRole !== Role.ADMIN &&
      option.question.quiz.course.instructorId !== userId
    ) {
      throw new ForbiddenException('You can only delete your own quiz options');
    }

    // Delete related student answers
    await this.prisma.studentQuizAnswer.deleteMany({
      where: { selectedOptionId: optionId },
    });

    return this.prisma.quizOption.delete({
      where: { id: optionId },
    });
  }

  /* ── Quiz Results/Attempts ──────────────────────────────────────── */

  async getAttempts(quizId: string, userId: string, userRole: Role) {
    // Verify quiz exists and user is the owner
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: true },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');

    if (userRole !== Role.ADMIN && quiz.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this quiz attempts',
      );
    }

    return this.prisma.quizAttempt.findMany({
      where: { quizId },
      include: {
        student: true,
        answers: {
          include: { selectedOption: true, question: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAttempt(attemptId: string, userId: string, userRole: Role) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: true,
        quiz: {
          include: { course: true },
        },
        answers: {
          include: { selectedOption: true, question: true },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');

    if (
      userRole !== Role.ADMIN &&
      attempt.quiz.course.instructorId !== userId
    ) {
      throw new ForbiddenException('You do not have access to this attempt');
    }

    return attempt;
  }
}
