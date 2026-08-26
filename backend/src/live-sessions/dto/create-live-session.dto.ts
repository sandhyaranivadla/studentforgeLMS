import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateLiveSessionDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  startTime: string;
}
