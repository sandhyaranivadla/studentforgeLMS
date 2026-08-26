import { IsString, IsOptional } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @IsOptional()
  submissionText?: string;
}
