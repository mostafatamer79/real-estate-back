// src/auth/dto/reset-otp.dto.ts
import { IsString, IsEmail, ValidateIf, IsOptional, IsNotEmpty, IsIn, Length, IsUUID } from 'class-validator';
import { IsSaudiPhoneNumber } from '../validator/IsSaudiNumber';

export class LoginDto{
    @IsEmail()
    @IsNotEmpty()
    email:string
    @IsNotEmpty()
    password:string
}



export class ResetOtpDto {
  @IsOptional()
  @IsEmail()
  @ValidateIf((o: ResetOtpDto) => !o.phone) // Validate email if phone is not provided
  email?: string;

  @IsOptional()
  @IsSaudiPhoneNumber()
  @ValidateIf((o: ResetOtpDto) => !o.email) // Validate phone if email is not provided
  phone?: string;
}

export class StartNafathDto {
  @IsOptional()
  @IsIn(['ar', 'en'])
  locale?: 'ar' | 'en';
}

export class NafathStatusDto {
  @IsUUID()
  requestId: string;

  @IsUUID()
  clientSecret: string;
}

export class NafathCallbackDto {
  @IsString()
  @Length(1, 4096)
  state: string;

  @IsOptional()
  @IsString()
  requestId?: string;
}

export class CompleteNafathDto extends NafathStatusDto {
  @IsString()
  @Length(1, 4096)
  state: string;
}
