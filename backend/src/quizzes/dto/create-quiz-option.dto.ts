import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateQuizOptionDto {
  @IsString()
  @IsNotEmpty()
  optionText!: string;

  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}
