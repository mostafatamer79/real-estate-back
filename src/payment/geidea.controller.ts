import { Body, Controller, HttpCode, Post, Req, UnauthorizedException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { SkipSubscriptionGuard } from '../common/decorators/skip-subscription.decorator';
import { CreateGeideaSessionDto, VerifyGeideaOrderDto } from './geidea.dto';
import { GeideaService } from './geidea.service';

@Controller('payment/geidea')
@SkipSubscriptionGuard()
export class GeideaController {
  constructor(private readonly geidea: GeideaService) {}

  @Post('session')
  createSession(@Body() body: CreateGeideaSessionDto, @Req() req: { user?: { id: string; email?: string } }) {
    return this.geidea.createSession(body, req.user);
  }

  @Post('verify')
  @HttpCode(200)
  verify(@Body() body: VerifyGeideaOrderDto, @Req() req: { user?: { id: string } }) {
    if (!req.user?.id) throw new UnauthorizedException('Authentication required');
    return this.geidea.verifyOrder(body.orderId, req.user);
  }

  @Post('callback')
  @Public()
  @HttpCode(200)
  callback(@Body() body: { orderId?: string; order?: { orderId?: string } }) {
    return this.geidea.verifyOrder(body?.order?.orderId || body?.orderId || '');
  }
}
