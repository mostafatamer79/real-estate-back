import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { CreateMarketingRequestDto, UpdateMarketingRequestDto } from './dto/marketing-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('marketing')
@UseGuards(JwtAuthGuard)
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Post()
  create(@Body() createDto: CreateMarketingRequestDto, @Request() req) {
    return this.marketingService.create(createDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.marketingService.findAll();
  }

  @Get('my-requests')
  findByClient(@Request() req) {
      return this.marketingService.findByClient(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.marketingService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateMarketingRequestDto) {
    return this.marketingService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.marketingService.remove(id);
  }
}
