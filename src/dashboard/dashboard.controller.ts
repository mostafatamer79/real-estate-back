import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('manager')
  @UseGuards(JwtAuthGuard)
  async getManagerDashboard(@Request() req) {
    return this.dashboardService.getManagerSummary(req.user);
  }
}

