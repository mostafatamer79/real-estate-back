import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Length, MinLength } from "class-validator"
import { IsSaudiPhoneNumber } from "src/validator/IsSaudiNumber"
import { Role } from "./user-entity"

export class CreateUserDto{
    @IsOptional()
     firstName:string
     @IsOptional()
     lastName:string
     @IsOptional()
     @IsSaudiPhoneNumber()
     phone:string
     @IsOptional()
    @IsEmail()
    email:string
    @IsOptional()
    @IsDate()
    expiredOtp:Date


 
 }

 export class VerifyOtpDto {
    email?: string;
    phone?: string;
    otp: string;
  }

  export class UpdateUserDto {
    @IsOptional()
    @IsString()
    firstName?: string;
  
    @IsOptional()
    @IsString()
    lastName?: string;
  
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
  
    @IsOptional()
    @IsString()
    agentLicenseNumber?: string;
  
    @IsOptional()
    @IsString()
    address?: string;
  
    @IsOptional()
    @IsString()
    city?: string;
  
    @IsOptional()
    @IsString()
    country?: string;
  
    @IsOptional()
    @IsString()
    profileImage?: string;
  
    @IsOptional()
    @IsString()
    idDocument?: string;
  
    @IsOptional()
    @IsString()
    licenseDocument?: string;
  }