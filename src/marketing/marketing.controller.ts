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

  // Specific routes must come before generic :id
  @Get('my-requests')
  findByClient(@Request() req) {
      return this.marketingService.findByClient(req.user.userId);
  }

  // Photographer Profiles
  @Post('profiles')
  createProfile(@Body() profileData: any) {
    return this.marketingService.createPhotographerProfile(profileData);
  }

  @Get('profiles/me')
  getMyProfile(@Request() req) {
    return this.marketingService.getPhotographerProfile(req.user.userId);
  }

  // Email Marketing — primary routes (/marketing/email)
  @Post('email')
  createEmailMarketing(@Body() createDto: any) {
    return this.marketingService.createEmailMarketing(createDto);
  }

  @Get('email')
  findAllEmailMarketing() {
    return this.marketingService.findAllEmailMarketing();
  }

  @Post('email/trigger')
  triggerEmails() {
    return this.marketingService.sendScheduledEmails();
  }

  @Get('email/:id')
  findOneEmailMarketing(@Param('id') id: string) {
    return this.marketingService.getEmailMarketingById(id);
  }

  @Patch('email/:id')
  updateEmailMarketing(@Param('id') id: string, @Body() updateDto: any) {
    return this.marketingService.updateEmailMarketing(id, updateDto);
  }

  @Delete('email/:id')
  removeEmailMarketing(@Param('id') id: string) {
    return this.marketingService.removeEmailMarketing(id);
  }

  // Email Marketing — alias routes (/marketing/email-marketing) used by admin panel
  @Post('email-marketing')
  createEmailMarketingAlias(@Body() createDto: any) {
    return this.marketingService.createEmailMarketing(createDto);
  }

  @Get('email-marketing')
  findAllEmailMarketingAlias() {
    return this.marketingService.findAllEmailMarketing();
  }

  @Post('email-marketing/trigger')
  triggerEmailsAlias() {
    return this.marketingService.sendScheduledEmails();
  }

  @Get('email-marketing/:id')
  findOneEmailMarketingAlias(@Param('id') id: string) {
    return this.marketingService.getEmailMarketingById(id);
  }

  @Patch('email-marketing/:id')
  updateEmailMarketingAlias(@Param('id') id: string, @Body() updateDto: any) {
    return this.marketingService.updateEmailMarketing(id, updateDto);
  }

  @Delete('email-marketing/:id')
  removeEmailMarketingAlias(@Param('id') id: string) {
    return this.marketingService.removeEmailMarketing(id);
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

  // Campaign Analytics
  @Get('requests/:id/campaigns')
  getCampaigns(@Param('id') id: string) {
    return this.marketingService.getCampaignsByRequest(id);
  }

  @Get('campaigns/:id/analytics')
  getCampaignAnalytics(@Param('id') id: string) {
    return this.marketingService.getCampaignAnalytics(id);
  }

  @Patch('campaigns/:id')
  updateCampaign(@Param('id') id: string, @Body() stats: any) {
    return this.marketingService.updateCampaignStats(id, stats);
  }
}
