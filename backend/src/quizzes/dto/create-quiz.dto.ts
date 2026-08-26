import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsNumber()
  @IsOptional()
  timeLimit?: number; // minutes

  @IsNumber()
  @IsOptional()
  passingScore?: number; // percentage

  @IsBoolean()
  @IsOptional()
  showCorrectAnswers?: boolean;

  @IsBoolean()
  @IsOptional()
  randomizeQuestions?: boolean;

  @IsString()
  @IsOptional()
  moduleId?: string;
}
