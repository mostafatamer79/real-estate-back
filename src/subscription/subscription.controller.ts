import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  CancelSubscriptionDto,
} from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  async create(@Request() req, @Body() createSubscriptionDto: CreateSubscriptionDto) {
    return await this.subscriptionService.create(
      req.user.userId,
      createSubscriptionDto,
    );
  }

  @Get('my')
  async getMySubscriptions(@Request() req) {
    return await this.subscriptionService.findMySubscriptions(req.user.userId);
  }

  @Get('my/active')
  async getMyActiveSubscriptions(@Request() req) {
    return await this.subscriptionService.findActiveSubscriptions(req.user.userId);
  }

  @Get('property/:propertyId')
  async getByProperty(@Param('propertyId') propertyId: string) {
    return await this.subscriptionService.getSubscriptionsByProperty(propertyId);
  }

  @Get('unit/:unitId')
  async getByUnit(@Param('unitId') unitId: string) {
    return await this.subscriptionService.getSubscriptionsByUnit(unitId);
  }

  @Get()
  async findAll(@Request() req) {
    // Admin can see all, users see only their own
    const userId = req.user.role === 'admin' ? undefined : req.user.userId;
    return await this.subscriptionService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.subscriptionService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return await this.subscriptionService.update(
      id,
      req.user.userId,
      updateSubscriptionDto,
    );
  }

  @Delete(':id')
  async cancel(
    @Param('id') id: string,
    @Request() req,
    @Body() cancelSubscriptionDto: CancelSubscriptionDto,
  ) {
    return await this.subscriptionService.cancel(
      id,
      req.user.userId,
      cancelSubscriptionDto,
    );
  }

  @Post(':id/activate')
  async activate(@Param('id') id: string) {
    return await this.subscriptionService.activate(id);
  }
}
