// src/auth/dto/reset-otp.dto.ts
import { IsString, IsEmail, ValidateIf, IsOptional, IsNotEmpty, IsIn, Length } from 'class-validator';
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
  @ValidateIf(o => !o.phone) // Validate email if phone is not provided
  email?: string;

  @IsOptional()
  @IsSaudiPhoneNumber()
  @ValidateIf(o => !o.email) // Validate phone if email is not provided
  phone?: string;
}

export class StartNafathDto {
  @IsString()
  @Length(8, 20)
  nationalId: string;

  @IsOptional()
  @IsIn(['ar', 'en'])
  locale?: 'ar' | 'en';
}

export class NafathStatusDto {
  @IsString()
  requestId: string;

  @IsString()
  clientSecret: string;
}

export class NafathCallbackDto {
  @IsString()
  token: string;

  @IsString()
  requestId: string;

  @IsString()
  transId: string;
}
