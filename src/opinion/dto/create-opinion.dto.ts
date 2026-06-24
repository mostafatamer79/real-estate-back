import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateOpinionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
