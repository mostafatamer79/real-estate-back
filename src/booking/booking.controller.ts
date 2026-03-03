import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { BookingStatus } from './entities/booking.entity';

@Controller('booking')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto, @Req() req) {
    return this.bookingService.create(createBookingDto, req.user);
  }

  @Get()
  findAll(@Req() req) {
    return this.bookingService.findAll(req.user);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  // @Roles([Role.ADMIN]) // Allow admins to see user bookings
  findUserBookings(@Param('userId') userId: string) {
    return this.bookingService.findByUser(userId);
  }

  @Get('offer/:offerId')
  @UseGuards(JwtAuthGuard)
  findOfferBookings(@Param('offerId') offerId: string) {
    return this.bookingService.findByOffer(offerId);
  }

  @Get('incoming')
  findIncoming(@Req() req) {
    return this.bookingService.findIncoming(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.bookingService.findOne(id, req.user);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: BookingStatus, @Req() req) {
    return this.bookingService.updateStatus(id, status, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.bookingService.remove(id, req.user);
  }
}
