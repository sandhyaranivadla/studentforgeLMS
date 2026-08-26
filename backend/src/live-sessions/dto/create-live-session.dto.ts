import { IsString, IsNotEmpty, IsOptional, IsISO8601 } from 'class-validator';

export class CreateLiveSessionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsISO8601()
  @IsNotEmpty()
  startTime!: string;

  @IsISO8601()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  moduleId?: string;
}
