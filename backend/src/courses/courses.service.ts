import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';
import {
  CreateModuleDto,
  UpdateModuleDto,
  CreateLessonDto,
  UpdateLessonDto,
} from './dto/module-lesson.dto';
import { Role } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async createCourse(
    userId: string,
    createCourseDto: CreateCourseDto,
    userRole?: Role,
  ) {
    // If admin provides an instructorId, use it. Otherwise default to the requester (useful if Instructor creates it, though instructors aren't supposed to anymore).
    const instructorId =
      userRole === Role.ADMIN && createCourseDto.instructorId
        ? createCourseDto.instructorId
        : userId;

    // omit instructorId from the rest of the dto to avoid Prisma type errors if it's there
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { instructorId: _omitted, ...courseData } = createCourseDto;

    return this.prisma.course.create({
      data: {
        ...courseData,
        instructorId,
      },
    });
  }

  async findAll(userRole?: Role, userId?: string) {
    // Students only see published courses, instructors see their own, admins see all
    const where =
      userRole === Role.STUDENT
        ? { published: true }
        : userRole === Role.INSTRUCTOR
          ? { instructorId: userId }
          : {};
    return this.prisma.course.findMany({
      where,
      include: {
        instructor: { select: { name: true, email: true } },
        modules: {
          include: { lessons: { orderBy: { orderIndex: 'asc' } } },
          orderBy: { orderIndex: 'asc' },
        },
        ...(userRole === Role.ADMIN
          ? { enrollments: { select: { id: true } } }
          : {}),
      },
    });
  }

  async findOne(id: string, userRole?: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { name: true, email: true } },
        modules: {
          include: { lessons: { orderBy: { orderIndex: 'asc' } } },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    if (userRole === Role.STUDENT && !course.published) {
      throw new ForbiddenException(`Course is not published`);
    }

    return course;
  }

  async updateCourse(
    id: string,
    userId: string,
    updateCourseDto: UpdateCourseDto,
    userRole: Role,
  ) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');

    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException('You can only update your own courses');
    }

    return this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
    });
  }

  async removeCourse(id: string, userId: string, userRole: Role) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');

    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException('You can only delete your own courses');
    }

    return this.prisma.course.delete({ where: { id } });
  }

  async createModule(
    courseId: string,
    userId: string,
    createModuleDto: CreateModuleDto,
    userRole: Role,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (userRole !== Role.ADMIN && course.instructorId !== userId)
      throw new ForbiddenException();

    return this.prisma.courseModule.create({
      data: {
        ...createModuleDto,
        courseId,
      },
    });
  }

  async updateModule(
    moduleId: string,
    userId: string,
    updateModuleDto: UpdateModuleDto,
    userRole: Role,
  ) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });
    if (!module) throw new NotFoundException('Module not found');
    if (userRole !== Role.ADMIN && module.course.instructorId !== userId)
      throw new ForbiddenException();

    return this.prisma.courseModule.update({
      where: { id: moduleId },
      data: updateModuleDto,
    });
  }

  async removeModule(moduleId: string, userId: string, userRole: Role) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });
    if (!module) throw new NotFoundException('Module not found');
    if (userRole !== Role.ADMIN && module.course.instructorId !== userId)
      throw new ForbiddenException();

    return this.prisma.courseModule.delete({ where: { id: moduleId } });
  }

  async createLesson(
    moduleId: string,
    userId: string,
    createLessonDto: CreateLessonDto,
    userRole: Role,
  ) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });
    if (!module) throw new NotFoundException('Module not found');
    if (userRole !== Role.ADMIN && module.course.instructorId !== userId)
      throw new ForbiddenException();

    return this.prisma.lesson.create({
      data: {
        ...createLessonDto,
        moduleId,
      },
    });
  }

  async updateLesson(
    lessonId: string,
    userId: string,
    updateLessonDto: UpdateLessonDto,
    userRole: Role,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (userRole !== Role.ADMIN && lesson.module.course.instructorId !== userId)
      throw new ForbiddenException();

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: updateLessonDto,
    });
  }

  async removeLesson(lessonId: string, userId: string, userRole: Role) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (userRole !== Role.ADMIN && lesson.module.course.instructorId !== userId)
      throw new ForbiddenException();

    return this.prisma.lesson.delete({ where: { id: lessonId } });
  }
}
