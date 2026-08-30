import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class UpdateAssignmentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @IsOptional()
  maxMarks?: number;

  @IsString()
  @IsOptional()
  moduleId?: string;
}
