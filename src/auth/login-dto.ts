// src/auth/dto/reset-otp.dto.ts
import { IsString,  IsEmail, ValidateIf, IsOptional, IsNotEmpty } from 'class-validator';
import { IsSaudiPhoneNumber } from 'src/validator/IsSaudiNumber';

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