import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, VerifyOtpDto } from '../user/create-user-dto';
import { NafathCallbackDto, NafathStatusDto, ResetOtpDto, StartNafathDto } from './login-dto';
import { NafathService } from './nafath/nafath.service';
import { SkipSubscriptionGuard } from '../common/decorators/skip-subscription.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@SkipSubscriptionGuard()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly nafathService: NafathService) {}

  @Public()
  @Post('nafath/request')
  startNafath(@Body() body: StartNafathDto, @Req() request: any) {
    const forwardedFor = request.headers['x-forwarded-for'];
    const endUserIp = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : request.ip;
    return this.nafathService.startAuthentication(body.nationalId, endUserIp, body.locale || 'ar');
  }

  @Public()
  @Get('nafath/status')
  nafathStatus(@Query() query: NafathStatusDto) {
    return this.nafathService.getAuthenticationStatus(query.requestId, query.clientSecret);
  }

  @Public()
  @Post('nafath/callback')
  async nafathCallback(@Body() body: NafathCallbackDto) {
    await this.nafathService.handleCallback(body);
    return {};
  }

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

  @UseGuards(JwtAuthGuard)
  @Post('impersonate/:id')
  impersonate(@Req() req: any, @Param('id') targetUserId: string) {
    return this.authService.impersonate(req.user.id || req.user.userId || req.user.sub, targetUserId);
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
