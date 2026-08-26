import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateQuizDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsNumber()
  @IsOptional()
  timeLimit?: number;

  @IsNumber()
  @IsOptional()
  passingScore?: number;

  @IsBoolean()
  @IsOptional()
  showCorrectAnswers?: boolean;

  @IsBoolean()
  @IsOptional()
  randomizeQuestions?: boolean;
}
