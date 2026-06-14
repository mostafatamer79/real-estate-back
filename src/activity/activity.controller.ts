import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async findAll(@Query('limit') limit?: number) {
    return await this.activityService.findAll(limit || 10);
  }

  @Get('me')
  async findMine(@Query('limit') limit?: number, @Req() req?: any) {
    return await this.activityService.findByUser(req.user.userId || req.user.id, limit || 10);
  }

  @Get('recent')
  async getRecent() {
    return await this.activityService.getRecentActivities();
  }
}
