import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, IsEmail } from 'class-validator';

export class CreateTenantDto {
    @IsNotEmpty()
    @IsString()
    fullName: string;

    @IsOptional()
    @IsString()
    idNumber?: string;

    @IsOptional()
    @IsString()
    idDocumentUrl?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    employer?: string;

    @IsOptional()
    @IsEnum(['individual', 'company'])
    type?: 'individual' | 'company';

    @IsOptional()
    @IsNumber()
    preferredPaymentDay?: number;
    
    @IsOptional()
    @IsString()
    userId?: string; // If linking to existing user
}
