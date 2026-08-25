import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class CreateEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  courseId!: string;
}

export class UpdateEnrollmentDto {
  @IsNumber()
  @IsOptional()
  progress?: number;

  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;
}
