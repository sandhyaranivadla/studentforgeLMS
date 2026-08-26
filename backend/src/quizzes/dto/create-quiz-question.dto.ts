import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateQuizQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText!: string;

  @IsNumber()
  @IsOptional()
  marks?: number;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}
