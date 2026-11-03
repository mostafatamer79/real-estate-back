import type { Request, Response } from 'express';
import { BadRequestException, Body, Controller, Get, HttpCode, Redirect, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, VerifyOtpDto } from '../user/create-user-dto';
import { CompleteNafathDto, NafathCallbackDto, NafathStatusDto, ResetOtpDto, StartNafathDto } from './login-dto';
import { NafathService } from './nafath/nafath.service';
import { SkipSubscriptionGuard } from '../common/decorators/skip-subscription.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AllowUnverified } from '../common/decorators/allow-unverified.decorator';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

type AuthenticatedRequest = Request & { user: { id: string; userId?: string; sub?: string } };

@AllowUnverified()
@SkipSubscriptionGuard()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly nafathService: NafathService) {}

  @Public()
  @Get('nafath/availability')
  nafathAvailability() {
    return this.nafathService.availability();
  }

  @Post('nafath/request')
  startNafath(@Body() body: StartNafathDto, @Req() request: AuthenticatedRequest) {
    return this.nafathService.startAuthentication(request.user.id, request.ip || request.socket.remoteAddress || '', body.locale || 'ar');
  }

  @Get('nafath/status')
  nafathStatus(@Query() query: NafathStatusDto, @Req() request: AuthenticatedRequest) {
    return this.nafathService.getAuthenticationStatus(query.requestId, query.clientSecret, request.user.id);
  }

  @Post('nafath/complete')
  completeNafath(@Body() body: CompleteNafathDto, @Req() request: AuthenticatedRequest) {
    return this.nafathService.completeAuthentication(body.requestId, body.clientSecret, request.user.id, body.state);
  }

  @Public()
  @HttpCode(200)
  @Post('nafath/callback')
  async nafathCallback(@Body() body: NafathCallbackDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    // Browser form callbacks must return the person to their profile. API callbacks
    // retain the guide's HTTP 200/true contract (including Accept: */*).
    const browserReturn = request.headers.accept?.includes('text/html');
    const returnUrl = browserReturn ? this.nafathService.getReturnUrl() : undefined;
    try {
      await this.nafathService.handleCallback(body);
    } catch (error) {
      if (!returnUrl) throw error;
      response.status(303).location(`${returnUrl}?nafath=error`);
      return;
    }
    if (returnUrl) {
      response.status(303).location(`${returnUrl}?nafath=returned`);
      return;
    }
    return true;
  }

  @Public()
  @Get('nafath/callback')
  @Redirect()
  async nafathBrowserCallback(@Query() query: NafathCallbackDto) {
    // Return only to the server-configured profile URL; never accept a redirect from the callback.
    const url = this.nafathService.getReturnUrl();
    try {
      await this.nafathService.handleCallback(query);
      return { url: `${url}?nafath=returned`, statusCode: 303 };
    } catch {
      return { url: `${url}?nafath=error`, statusCode: 303 };
    }
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
  logout(@Req() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('impersonate/:id')
  impersonate(@Req() req: AuthenticatedRequest, @Param('id') targetUserId: string) {
    return this.authService.impersonate(req.user.id, targetUserId);
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
