import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateInfoBlockDto {
  @IsUUID()
  tabId: string;

  @IsString()
  @MaxLength(255)
  labelAr: string;

  @IsString()
  @MaxLength(255)
  labelEn: string;

  @IsString()
  textAr: string;

  @IsString()
  textEn: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

