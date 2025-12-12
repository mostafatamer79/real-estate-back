// auth.controller.ts
import { BadRequestException, Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto,VerifyOtpDto } from 'src/user/create-user-dto';
import { LoginDto, ResetOtpDto } from './login-dto';
import { Roles } from 'src/common/decorators/roles.decorators';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') token: string) {
    return this.authService.refresh(token);
  }
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req : any) {
    return this.authService.logout(req.user.id);
  }
  @Post('verify-otp')
verifyOtp(@Body() verifyOtpDto: any) {
  const email = verifyOtpDto.email || verifyOtpDto.phone;
  if (!email) {
    throw new Error('Either email or phone must be provided');
  }
  console.log('Verifying OTP for:', email, 'with OTP:', verifyOtpDto.otp);
  return this.authService.verifyOtp(email, verifyOtpDto.otp);
}
@Post('resend-otp')
async resetOtp(@Body() resetOtpDto: ResetOtpDto) {
  const identifier = resetOtpDto.email || resetOtpDto.phone;
  
  if (!identifier) {
    throw new BadRequestException('Either email or phone must be provided');
  }
  
  return this.authService.resetOtp(identifier);
}
}
