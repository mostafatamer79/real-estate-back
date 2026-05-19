import { BadRequestException, Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, VerifyOtpDto } from '../user/create-user-dto';
import { ResetOtpDto } from './login-dto';
import { SkipSubscriptionGuard } from '../common/decorators/skip-subscription.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@SkipSubscriptionGuard()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body('refreshToken') token: string) {
    return this.authService.refresh(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: any) {
    return this.authService.logout(req.user.id);
  }

  @Public()
  @Post('verify-otp')
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const identifier = verifyOtpDto.email || verifyOtpDto.phone;
    if (!identifier) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    return this.authService.verifyOtp(identifier, verifyOtpDto.otp);
  }

  @Public()
  @Post('resend-otp')
  resetOtp(@Body() resetOtpDto: ResetOtpDto) {
    const identifier = resetOtpDto.email || resetOtpDto.phone;

    if (!identifier) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    return this.authService.resetOtp(identifier);
  }
}
