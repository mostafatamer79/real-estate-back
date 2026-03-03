
import { Controller, Get, Patch, Param, Body, UseGuards, Query, Req } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingStatus } from './entities/booking.entity';
// Assuming you have an AdminGuard or similar mechanism. Using JwtAuthGuard for now, maybe with roles check.
import { JwtAuthGuard } from '../common/guards/jwt.guard';
// import { Roles } from '../common/decorators/roles.decorator';
// import { Role } from '../common/enums/role.enum';

@Controller('admin/bookings')
@UseGuards(JwtAuthGuard)
// @Roles(Role.ADMIN) // Uncomment if Roles guard is set up
export class AdminBookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('purchase')
  findAllPurchaseRequests() {
    return this.bookingService.findAllPurchaseRequestsAdmin();
  }

  @Get('visit')
  findAllVisitRequests() {
    return this.bookingService.findAllVisitRequestsAdmin();
  }

  @Get('orders')
  findAllOrders() {
    return this.bookingService.findAllOrdersAdmin();
  }

  @Patch(':id/status-purchase')
  updatePurchaseStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
    @Req() req
  ) {
    return this.bookingService.updatePurchaseStatusAdmin(id, status, req.user);
  }

  @Patch(':id/status-visit')
  updateVisitStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
    @Req() req
  ) {
    return this.bookingService.updateVisitStatusAdmin(id, status, req.user);
  }

  @Patch(':id/assign-agent')
  assignAgent(@Param('id') id: string, @Body('agentId') agentId: string, @Req() req) {
    return this.bookingService.assignAgentAdmin(id, agentId, req.user);
  }
}
