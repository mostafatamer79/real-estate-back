import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UnauthorizedException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MarketingService } from './marketing.service';
import { CreateMarketingRequestDto, UpdateMarketingRequestDto } from './dto/marketing-request.dto';
import { CreateEmailMarketingDto, UpdateEmailMarketingDto, ApproveEmailMarketingDto, RejectEmailMarketingDto } from './dto/email-marketing.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { Departments } from '../common/decorators/departments.decorators';
import { DepartmentsGuard } from '../common/guards/departments.guard';
import { SkipDepartmentsGuard } from '../common/decorators/skip-departments.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SkipSubscriptionGuard } from '../common/decorators/skip-subscription.decorator';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '../user/user-entity';
import { FileUploadService } from '../document/file-upload.service';

interface MarketingActorRequest { user: { id?: string; userId: string; role: Role } }

@Controller('marketing')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
@Departments('marketing')
export class MarketingController {
  constructor(
    private readonly marketingService: MarketingService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  private getActorId(req: MarketingActorRequest): string {
    const actorId = req?.user?.id || req?.user?.userId;
    if (!actorId) {
      throw new UnauthorizedException('Authentication required');
    }
    return actorId;
  }

  @Post()
  create(@Body() createDto: CreateMarketingRequestDto, @Request() req: MarketingActorRequest) {
    return this.marketingService.create(createDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.marketingService.findAll();
  }

  // Specific routes must come before generic :id
  @Get('my-requests')
  findByClient(@Request() req: MarketingActorRequest) {
      return this.marketingService.findByClient(req.user.userId);
  }

  // Photographer Profiles
  @Post('profiles')
  createProfile(@Body() profileData: any) {
    return this.marketingService.createPhotographerProfile(profileData);
  }

  @Get('profiles/me')
  getMyProfile(@Request() req: MarketingActorRequest) {
    return this.marketingService.getPhotographerProfile(req.user.userId);
  }

  // Email Marketing — primary routes (/marketing/email)
  @Post('email')
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  createEmailMarketing(@Body() createDto: CreateEmailMarketingDto, @Request() req: MarketingActorRequest) {
    return this.marketingService.createEmailMarketing(createDto, this.getActorId(req));
  }

  @Get('email')
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  findAllEmailMarketing(@Request() req: MarketingActorRequest) {
    return this.marketingService.findEmailMarketingByOwner(this.getActorId(req), req.user.role);
  }

  @Get('email/stats')
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  getEmailMarketingStats(@Request() req: MarketingActorRequest) {
    return this.marketingService.getEmailMarketingStats(this.getActorId(req));
  }

  @Post('email/trigger')
  @Roles([Role.ADMIN])
  triggerEmails() {
    return this.marketingService.sendScheduledEmails();
  }

  @Post('email/:id/approve')
  @Roles([Role.ADMIN])
  approveEmailMarketing(@Param('id') id: string, @Body() body: ApproveEmailMarketingDto) {
    return this.marketingService.approveEmailMarketing(id, body.publicationFee);
  }

  @Post('email/:id/reject')
  @Roles([Role.ADMIN])
  rejectEmailMarketing(@Param('id') id: string, @Body() body: RejectEmailMarketingDto) {
    return this.marketingService.rejectEmailMarketing(id, body?.reason);
  }

  @Get('email/:id')
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  findOneEmailMarketing(@Param('id') id: string, @Request() req: MarketingActorRequest) {
    return this.marketingService.getEmailMarketingById(id, this.getActorId(req), req.user.role);
  }

  @Patch('email/:id')
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  updateEmailMarketing(@Param('id') id: string, @Body() updateDto: UpdateEmailMarketingDto, @Request() req: MarketingActorRequest) {
    return this.marketingService.updateEmailMarketing(id, this.getActorId(req), updateDto, req.user.role);
  }

  @Delete('email/:id')
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  removeEmailMarketing(@Param('id') id: string, @Request() req: MarketingActorRequest) {
    return this.marketingService.removeEmailMarketing(id, this.getActorId(req), req.user.role);
  }

  // Email Marketing — alias routes (/marketing/email-marketing) used by admin panel
  @Post('email-marketing')
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  createEmailMarketingAlias(@Body() createDto: CreateEmailMarketingDto, @Request() req: MarketingActorRequest) {
    return this.marketingService.createEmailMarketing(createDto, this.getActorId(req));
  }

  @Get('email-marketing')
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  findAllEmailMarketingAlias(@Request() req: MarketingActorRequest) {
    return this.marketingService.findEmailMarketingByOwner(this.getActorId(req), req.user.role);
  }

  @Get('email-marketing/public')
  @Public()
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  findPublicEmailMarketing() {
    return this.marketingService.findPublicEmailMarketing();
  }

  @Get('email-marketing/stats')
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  getEmailMarketingStatsAlias(@Request() req: MarketingActorRequest) {
    return this.marketingService.getEmailMarketingStats(this.getActorId(req));
  }

  @Post('email-marketing/trigger')
  @Roles([Role.ADMIN])
  triggerEmailsAlias() {
    return this.marketingService.sendScheduledEmails();
  }

  @Post('email-marketing/:id/approve')
  @Roles([Role.ADMIN])
  approveEmailMarketingAlias(@Param('id') id: string, @Body() body: ApproveEmailMarketingDto) {
    return this.marketingService.approveEmailMarketing(id, body.publicationFee);
  }

  @Post('email-marketing/:id/reject')
  @Roles([Role.ADMIN])
  rejectEmailMarketingAlias(@Param('id') id: string, @Body() body: RejectEmailMarketingDto) {
    return this.marketingService.rejectEmailMarketing(id, body?.reason);
  }

  @Get('email-marketing/:id')
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  findOneEmailMarketingAlias(@Param('id') id: string, @Request() req: MarketingActorRequest) {
    return this.marketingService.getEmailMarketingById(id, this.getActorId(req), req.user.role);
  }

  @Patch('email-marketing/:id')
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  updateEmailMarketingAlias(@Param('id') id: string, @Body() updateDto: UpdateEmailMarketingDto, @Request() req: MarketingActorRequest) {
    return this.marketingService.updateEmailMarketing(id, this.getActorId(req), updateDto, req.user.role);
  }

  @Delete('email-marketing/:id')
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  removeEmailMarketingAlias(@Param('id') id: string, @Request() req: MarketingActorRequest) {
    return this.marketingService.removeEmailMarketing(id, this.getActorId(req), req.user.role);
  }

  @Post('email-marketing/:id/upload/media')
  @SkipDepartmentsGuard()
  @SkipSubscriptionGuard()
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMedia(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: MarketingActorRequest
  ) {
    const actorId = this.getActorId(req);
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('At least one media file is required');
    }
    await this.marketingService.assertCanUploadMedia(id, actorId, req.user.role);
    const uploaded = await Promise.all(
      files.map((file) => this.fileUploadService.uploadFile(file, 'marketing')),
    );
    const urls = uploaded.map((item) => item.fileUrl);
    return this.marketingService.addMedia(id, urls, actorId, req.user.role);
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
