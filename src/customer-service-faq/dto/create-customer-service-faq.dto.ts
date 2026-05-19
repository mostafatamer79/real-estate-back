import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCustomerServiceFaqDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsString()
  @MaxLength(255)
  categoryAr: string;

  @IsString()
  @MaxLength(255)
  categoryEn: string;

  @IsString()
  questionAr: string;

  @IsString()
  answerAr: string;

  @IsString()
  questionEn: string;

  @IsString()
  answerEn: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
