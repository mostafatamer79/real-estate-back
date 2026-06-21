import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MarketingService } from './marketing.service';
import { CreateMarketingRequestDto, UpdateMarketingRequestDto } from './dto/marketing-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { Departments } from '../common/decorators/departments.decorators';
import { DepartmentsGuard } from '../common/guards/departments.guard';
import { SkipDepartmentsGuard } from '../common/decorators/skip-departments.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SkipSubscriptionGuard } from '../common/decorators/skip-subscription.decorator';

@Controller('marketing')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
@Departments('marketing')
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
  createEmailMarketing(@Body() createDto: any, @Request() req) {
    return this.marketingService.createEmailMarketing(createDto, req.user.userId);
  }

  @Get('email')
  findAllEmailMarketing(@Request() req) {
    return this.marketingService.findEmailMarketingByOwner(req.user.userId, req.user.role);
  }

  @Get('email/stats')
  getEmailMarketingStats(@Request() req) {
    return this.marketingService.getEmailMarketingStats(req.user.userId);
  }

  @Post('email/trigger')
  triggerEmails() {
    return this.marketingService.sendScheduledEmails();
  }

  @Get('email/:id')
  findOneEmailMarketing(@Param('id') id: string, @Request() req) {
    return this.marketingService.getEmailMarketingById(id, req.user.userId, req.user.role);
  }

  @Patch('email/:id')
  updateEmailMarketing(@Param('id') id: string, @Body() updateDto: any, @Request() req) {
    return this.marketingService.updateEmailMarketing(id, req.user.userId, updateDto, req.user.role);
  }

  @Delete('email/:id')
  removeEmailMarketing(@Param('id') id: string, @Request() req) {
    return this.marketingService.removeEmailMarketing(id, req.user.userId, req.user.role);
  }

  // Email Marketing — alias routes (/marketing/email-marketing) used by admin panel
  @Post('email-marketing')
  createEmailMarketingAlias(@Body() createDto: any, @Request() req) {
    return this.marketingService.createEmailMarketing(createDto, req.user.userId);
  }

  @Get('email-marketing')
  findAllEmailMarketingAlias(@Request() req) {
    return this.marketingService.findEmailMarketingByOwner(req.user.userId, req.user.role);
  }

  @Get('email-marketing/public')
  @Public()
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  findPublicEmailMarketing() {
    return this.marketingService.findPublicEmailMarketing();
  }

  @Get('email-marketing/stats')
  getEmailMarketingStatsAlias(@Request() req) {
    return this.marketingService.getEmailMarketingStats(req.user.userId);
  }

  @Post('email-marketing/trigger')
  triggerEmailsAlias() {
    return this.marketingService.sendScheduledEmails();
  }

  @Get('email-marketing/:id')
  findOneEmailMarketingAlias(@Param('id') id: string, @Request() req) {
    return this.marketingService.getEmailMarketingById(id, req.user.userId, req.user.role);
  }

  @Patch('email-marketing/:id')
  updateEmailMarketingAlias(@Param('id') id: string, @Body() updateDto: any, @Request() req) {
    return this.marketingService.updateEmailMarketing(id, req.user.userId, updateDto, req.user.role);
  }

  @Delete('email-marketing/:id')
  removeEmailMarketingAlias(@Param('id') id: string, @Request() req) {
    return this.marketingService.removeEmailMarketing(id, req.user.userId, req.user.role);
  }

  @Post('email-marketing/:id/upload/media')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMedia(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    const urls = files.map((f, index) => `https://placeholder.com/image-${index}.jpg`);
    return this.marketingService.addMedia(id, urls, req.user.userId, req.user.role);
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
