import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesService } from './quizzes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('QuizzesService', () => {
  let service: QuizzesService;

  const mockPrisma = {
    course: {
      findUnique: jest.fn(),
    },
    courseModule: {
      findUnique: jest.fn(),
    },
    quiz: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    quizQuestion: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    quizOption: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    quizAttempt: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    studentQuizAnswer: {
      deleteMany: jest.fn(),
    },
  };

  const mockCourse = {
    id: 'course-1',
    title: 'Test Course',
    instructorId: 'instructor-1',
  };

  const mockQuiz = {
    id: 'quiz-1',
    courseId: 'course-1',
    moduleId: null,
    title: 'Test Quiz',
    description: 'Test Description',
    published: false,
    course: mockCourse,
    questions: [],
    attempts: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);

    jest.clearAllMocks();
  });

  describe('createQuiz', () => {
    it('should create a quiz for an instructor', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.quiz.create.mockResolvedValue(mockQuiz);

      const result = await service.createQuiz(
        'course-1',
        'instructor-1',
        { title: 'Test Quiz', description: 'Test' },
        Role.INSTRUCTOR,
      );

      expect(result).toEqual(mockQuiz);
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'course-1' },
      });
    });

    it('should throw error if course not found', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(
        service.createQuiz(
          'course-1',
          'instructor-1',
          { title: 'Test' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if instructor does not own the course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);

      await expect(
        service.createQuiz(
          'course-1',
          'different-instructor',
          { title: 'Test' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to create quiz for any course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.quiz.create.mockResolvedValue(mockQuiz);

      const result = await service.createQuiz(
        'course-1',
        'admin-user',
        { title: 'Test Quiz' },
        Role.ADMIN,
      );

      expect(result).toEqual(mockQuiz);
    });

    it('should validate module belongs to course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.courseModule.findUnique.mockResolvedValue(null);

      await expect(
        service.createQuiz(
          'course-1',
          'instructor-1',
          { title: 'Test', moduleId: 'wrong-module' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create quiz with module if valid', async () => {
      const mockModule = {
        id: 'module-1',
        courseId: 'course-1',
      };

      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.courseModule.findUnique.mockResolvedValue(mockModule);
      mockPrisma.quiz.create.mockResolvedValue({
        ...mockQuiz,
        moduleId: 'module-1',
      });

      const result = await service.createQuiz(
        'course-1',
        'instructor-1',
        { title: 'Test', moduleId: 'module-1' },
        Role.INSTRUCTOR,
      );

      expect(result.moduleId).toBe('module-1');
    });
  });

  describe('findAllByCourse', () => {
    it('should find all quizzes for a course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.quiz.findMany.mockResolvedValue([mockQuiz]);

      const result = await service.findAllByCourse(
        'course-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result).toEqual([mockQuiz]);
    });

    it('should throw if course not found', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(
        service.findAllByCourse('course-1', 'instructor-1', Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if instructor does not own course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);

      await expect(
        service.findAllByCourse(
          'course-1',
          'different-instructor',
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should find a quiz by id', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      const result = await service.findOne(
        'quiz-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result).toEqual(mockQuiz);
    });

    it('should throw if quiz not found', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('quiz-1', 'instructor-1', Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if instructor does not own quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      await expect(
        service.findOne('quiz-1', 'different-instructor', Role.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to view any quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      const result = await service.findOne('quiz-1', 'admin-user', Role.ADMIN);

      expect(result).toEqual(mockQuiz);
    });
  });

  describe('updateQuiz', () => {
    it('should update a quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      mockPrisma.quiz.update.mockResolvedValue({
        ...mockQuiz,
        title: 'Updated Title',
      });

      const result = await service.updateQuiz(
        'quiz-1',
        'instructor-1',
        { title: 'Updated Title' },
        Role.INSTRUCTOR,
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should throw if quiz not found', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.updateQuiz(
          'quiz-1',
          'instructor-1',
          { title: 'Test' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if instructor does not own quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      await expect(
        service.updateQuiz(
          'quiz-1',
          'different-instructor',
          { title: 'Test' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteQuiz', () => {
    it('should delete a quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      mockPrisma.studentQuizAnswer.deleteMany.mockResolvedValue({});
      mockPrisma.quizAttempt.deleteMany.mockResolvedValue({});
      mockPrisma.quizOption.deleteMany.mockResolvedValue({});
      mockPrisma.quizQuestion.deleteMany.mockResolvedValue({});
      mockPrisma.quiz.delete.mockResolvedValue(mockQuiz);

      const result = await service.deleteQuiz(
        'quiz-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result).toEqual(mockQuiz);
      expect(mockPrisma.quiz.delete).toHaveBeenCalledWith({
        where: { id: 'quiz-1' },
      });
    });

    it('should throw if quiz not found', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteQuiz('quiz-1', 'instructor-1', Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if instructor does not own quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      await expect(
        service.deleteQuiz('quiz-1', 'different-instructor', Role.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('publishQuiz', () => {
    it('should publish a quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      mockPrisma.quiz.update.mockResolvedValue({
        ...mockQuiz,
        published: true,
      });

      const result = await service.publishQuiz(
        'quiz-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result.published).toBe(true);
    });

    it('should throw if not authorized', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      await expect(
        service.publishQuiz('quiz-1', 'different-instructor', Role.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('unpublishQuiz', () => {
    it('should unpublish a quiz', async () => {
      const publishedQuiz = { ...mockQuiz, published: true };
      mockPrisma.quiz.findUnique.mockResolvedValue(publishedQuiz);
      mockPrisma.quiz.update.mockResolvedValue({
        ...publishedQuiz,
        published: false,
      });

      const result = await service.unpublishQuiz(
        'quiz-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result.published).toBe(false);
    });
  });

  describe('addQuestion', () => {
    it('should add a question to a quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      mockPrisma.quizQuestion.findFirst.mockResolvedValue(null);
      mockPrisma.quizQuestion.create.mockResolvedValue({
        id: 'question-1',
        quizId: 'quiz-1',
        questionText: 'Test Question',
        marks: 1.0,
        orderIndex: 1,
        options: [],
      });

      const result = await service.addQuestion(
        'quiz-1',
        'instructor-1',
        { questionText: 'Test Question' },
        Role.INSTRUCTOR,
      );

      expect(result.questionText).toBe('Test Question');
    });

    it('should throw if quiz not found', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.addQuestion(
          'quiz-1',
          'instructor-1',
          { questionText: 'Test' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if instructor does not own quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      await expect(
        service.addQuestion(
          'quiz-1',
          'different-instructor',
          { questionText: 'Test' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should auto-increment order index', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      mockPrisma.quizQuestion.findFirst.mockResolvedValue({
        id: 'question-0',
        orderIndex: 2,
      });
      mockPrisma.quizQuestion.create.mockResolvedValue({
        id: 'question-1',
        quizId: 'quiz-1',
        questionText: 'Test',
        marks: 1.0,
        orderIndex: 3,
        options: [],
      });

      const result = await service.addQuestion(
        'quiz-1',
        'instructor-1',
        { questionText: 'Test' },
        Role.INSTRUCTOR,
      );

      expect(result.orderIndex).toBe(3);
    });
  });

  describe('getQuestions', () => {
    it('should get all questions for a quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      mockPrisma.quizQuestion.findMany.mockResolvedValue([
        {
          id: 'question-1',
          quizId: 'quiz-1',
          questionText: 'Test',
          marks: 1.0,
          orderIndex: 1,
          options: [],
        },
      ]);

      const result = await service.getQuestions(
        'quiz-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result).toHaveLength(1);
    });

    it('should throw if quiz not found', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.getQuestions('quiz-1', 'instructor-1', Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateQuestion', () => {
    it('should update a question', async () => {
      mockPrisma.quizQuestion.findUnique.mockResolvedValue({
        id: 'question-1',
        quizId: 'quiz-1',
        questionText: 'Old Text',
        marks: 1.0,
        orderIndex: 1,
        quiz: { course: mockCourse },
        options: [],
      });
      mockPrisma.quizQuestion.update.mockResolvedValue({
        id: 'question-1',
        quizId: 'quiz-1',
        questionText: 'New Text',
        marks: 2.0,
        orderIndex: 1,
        options: [],
      });

      const result = await service.updateQuestion(
        'question-1',
        'instructor-1',
        { questionText: 'New Text', marks: 2.0 },
        Role.INSTRUCTOR,
      );

      expect(result.questionText).toBe('New Text');
      expect(result.marks).toBe(2.0);
    });

    it('should throw if question not found', async () => {
      mockPrisma.quizQuestion.findUnique.mockResolvedValue(null);

      await expect(
        service.updateQuestion(
          'question-1',
          'instructor-1',
          { questionText: 'New' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteQuestion', () => {
    it('should delete a question', async () => {
      mockPrisma.quizQuestion.findUnique.mockResolvedValue({
        id: 'question-1',
        quizId: 'quiz-1',
        quiz: { course: mockCourse },
      });
      mockPrisma.studentQuizAnswer.deleteMany.mockResolvedValue({});
      mockPrisma.quizOption.deleteMany.mockResolvedValue({});
      mockPrisma.quizQuestion.delete.mockResolvedValue({
        id: 'question-1',
        quizId: 'quiz-1',
      });

      const result = await service.deleteQuestion(
        'question-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result.id).toBe('question-1');
    });

    it('should throw if question not found', async () => {
      mockPrisma.quizQuestion.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteQuestion('question-1', 'instructor-1', Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addOption', () => {
    it('should add an option to a question', async () => {
      mockPrisma.quizQuestion.findUnique.mockResolvedValue({
        id: 'question-1',
        quizId: 'quiz-1',
        quiz: { course: mockCourse },
      });
      mockPrisma.quizOption.findFirst.mockResolvedValue(null);
      mockPrisma.quizOption.create.mockResolvedValue({
        id: 'option-1',
        questionId: 'question-1',
        optionText: 'Option A',
        isCorrect: false,
        orderIndex: 1,
      });

      const result = await service.addOption(
        'question-1',
        'instructor-1',
        { optionText: 'Option A' },
        Role.INSTRUCTOR,
      );

      expect(result.optionText).toBe('Option A');
    });

    it('should throw if question not found', async () => {
      mockPrisma.quizQuestion.findUnique.mockResolvedValue(null);

      await expect(
        service.addOption(
          'question-1',
          'instructor-1',
          { optionText: 'A' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOption', () => {
    it('should update an option', async () => {
      mockPrisma.quizOption.findUnique.mockResolvedValue({
        id: 'option-1',
        questionId: 'question-1',
        optionText: 'Old Text',
        isCorrect: false,
        question: {
          quiz: { course: mockCourse },
        },
      });
      mockPrisma.quizOption.update.mockResolvedValue({
        id: 'option-1',
        questionId: 'question-1',
        optionText: 'New Text',
        isCorrect: true,
      });

      const result = await service.updateOption(
        'option-1',
        'instructor-1',
        { optionText: 'New Text', isCorrect: true },
        Role.INSTRUCTOR,
      );

      expect(result.optionText).toBe('New Text');
      expect(result.isCorrect).toBe(true);
    });

    it('should throw if option not found', async () => {
      mockPrisma.quizOption.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOption(
          'option-1',
          'instructor-1',
          { optionText: 'A' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteOption', () => {
    it('should delete an option', async () => {
      mockPrisma.quizOption.findUnique.mockResolvedValue({
        id: 'option-1',
        questionId: 'question-1',
        question: {
          quiz: { course: mockCourse },
        },
      });
      mockPrisma.studentQuizAnswer.deleteMany.mockResolvedValue({});
      mockPrisma.quizOption.delete.mockResolvedValue({
        id: 'option-1',
      });

      const result = await service.deleteOption(
        'option-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result.id).toBe('option-1');
    });

    it('should throw if option not found', async () => {
      mockPrisma.quizOption.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteOption('option-1', 'instructor-1', Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAttempts', () => {
    it('should get all attempts for a quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      mockPrisma.quizAttempt.findMany.mockResolvedValue([
        {
          id: 'attempt-1',
          quizId: 'quiz-1',
          studentId: 'student-1',
          score: 80,
        },
      ]);

      const result = await service.getAttempts(
        'quiz-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result).toHaveLength(1);
    });

    it('should throw if quiz not found', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.getAttempts('quiz-1', 'instructor-1', Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if instructor does not own quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      await expect(
        service.getAttempts('quiz-1', 'different-instructor', Role.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAttempt', () => {
    it('should get a specific attempt', async () => {
      mockPrisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'attempt-1',
        quizId: 'quiz-1',
        studentId: 'student-1',
        quiz: { course: mockCourse },
        answers: [],
      });

      const result = await service.getAttempt(
        'attempt-1',
        'instructor-1',
        Role.INSTRUCTOR,
      );

      expect(result.id).toBe('attempt-1');
    });

    it('should throw if attempt not found', async () => {
      mockPrisma.quizAttempt.findUnique.mockResolvedValue(null);

      await expect(
        service.getAttempt('attempt-1', 'instructor-1', Role.INSTRUCTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if instructor does not own the quiz', async () => {
      mockPrisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'attempt-1',
        quizId: 'quiz-1',
        quiz: { course: mockCourse },
      });

      await expect(
        service.getAttempt(
          'attempt-1',
          'different-instructor',
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Cross-instructor Security', () => {
    it('should prevent instructor A from modifying instructor B quiz', async () => {
      const courseB = { id: 'course-2', instructorId: 'instructor-2' };
      const quizB = { id: 'quiz-2', courseId: 'course-2', course: courseB };

      mockPrisma.quiz.findUnique.mockResolvedValue(quizB);

      await expect(
        service.updateQuiz(
          'quiz-2',
          'instructor-1',
          { title: 'Hacked' },
          Role.INSTRUCTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent instructor A from deleting instructor B quiz', async () => {
      const courseB = { id: 'course-2', instructorId: 'instructor-2' };
      const quizB = { id: 'quiz-2', courseId: 'course-2', course: courseB };

      mockPrisma.quiz.findUnique.mockResolvedValue(quizB);

      await expect(
        service.deleteQuiz('quiz-2', 'instructor-1', Role.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to modify any quiz', async () => {
      const courseB = { id: 'course-2', instructorId: 'instructor-2' };
      const quizB = { id: 'quiz-2', courseId: 'course-2', course: courseB };

      mockPrisma.quiz.findUnique.mockResolvedValue(quizB);
      mockPrisma.quiz.update.mockResolvedValue({ ...quizB, title: 'Updated' });

      const result = await service.updateQuiz(
        'quiz-2',
        'admin-user',
        { title: 'Updated' },
        Role.ADMIN,
      );

      expect(result.title).toBe('Updated');
    });
  });
});
