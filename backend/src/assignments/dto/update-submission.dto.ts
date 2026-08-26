import { IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateSubmissionDto {
  @IsNumber()
  @IsOptional()
  marks?: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}
