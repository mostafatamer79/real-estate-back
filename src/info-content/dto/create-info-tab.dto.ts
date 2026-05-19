import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateInfoTabDto {
  @IsString()
  @MaxLength(50)
  key: string;

  @IsString()
  @MaxLength(255)
  titleAr: string;

  @IsString()
  @MaxLength(255)
  titleEn: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

