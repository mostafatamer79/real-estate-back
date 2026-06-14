
import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, ParseUUIDPipe, UseInterceptors, UploadedFiles, Request,
  UseGuards, Ip
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OffersService } from './offers.service';
import { CreateOfferDto, UpdateOfferDto } from './create-offer.dto';
// remove imports
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { Departments } from '../common/decorators/departments.decorators';
import { DepartmentsGuard } from '../common/guards/departments.guard';
import { getUserFromRequest } from '../common/utils/request-user.util';
import { SkipDepartmentsGuard } from '../common/decorators/skip-departments.decorator';
import { OfferReportStatus } from './entities/offer-report.entity';

@Controller('offers')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
@Departments('properties', 'offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  create(@Body() dto: CreateOfferDto, @Request() req) {
    const user = getUserFromRequest(req);
    return this.offersService.create(dto, user);
  }

  @Get()
  findAll(@Request() req, @Query() query) {
    const user = getUserFromRequest(req);
    return this.offersService.findAll(user, {
      ...query,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
    });
  }

  @Get('search')
  search(@Request() req, @Query('q') q: string) {
    const user = getUserFromRequest(req);
    return this.offersService.search(q, user);
  }

  @Get('my-offers')
  @UseGuards(JwtAuthGuard)
  findMyOffers(@Request() req) {
    const user = getUserFromRequest(req);
    return this.offersService.findByUser(user.userId);
  }

  @Get('reports')
  findReports(@Request() req, @Query('status') status?: OfferReportStatus | 'all') {
    const user = getUserFromRequest(req);
    return this.offersService.findReports(user, status);
  }

  @Patch('reports/:reportId')
  updateReport(@Param('reportId', ParseUUIDPipe) reportId: string, @Body() body: any, @Request() req) {
    const user = getUserFromRequest(req);
    return this.offersService.updateReport(reportId, body, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const user = getUserFromRequest(req);
    return this.offersService.findOne(id, user);
  }

  @Post(':id/reports')
  @SkipDepartmentsGuard()
  reportOffer(@Param('id', ParseUUIDPipe) id: string, @Body() body: any, @Request() req) {
    const user = getUserFromRequest(req);
    return this.offersService.reportOffer(id, body, user);
  }

  @Post(':id/view')
  async incrementView(@Param('id', ParseUUIDPipe) id: string, @Ip() ip: string) {
    return this.offersService.incrementViewCount(id, ip);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOfferDto, @Request() req) {
    const user = getUserFromRequest(req);
    // Note: The service should likely check ownership if role is USER
    return this.offersService.update(id, dto, user);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: string, @Request() req) {
    const user = getUserFromRequest(req);
    return this.offersService.updateStatus(id, status, user);
  }

  @Patch(':id/active')
  setActive(@Param('id', ParseUUIDPipe) id: string, @Body('isActive') isActive: boolean, @Request() req) {
    const user = getUserFromRequest(req);
    return this.offersService.setActive(id, isActive, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const user = getUserFromRequest(req);
    return this.offersService.remove(id, user); // Soft delete
  }

  @Delete(':id/hard')
  delete(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const user = getUserFromRequest(req);
    return this.offersService.delete(id, user); // Hard delete
  }

  // File uploads
  @Post(':id/upload/media')
  @UseInterceptors(FilesInterceptor('files', 10)) // defaults to memory storage
  async uploadMedia(@Param('id', ParseUUIDPipe) id: string, @UploadedFiles() files: Express.Multer.File[], @Request() req) {
    const user = getUserFromRequest(req);
    // WARNING: In a real Vercel deployment, you must upload 'files' (which are in memory) to S3/Cloudinary here.
    // For now, we return a placeholder URL to prevent crashing.
    console.warn('Files received in memory but not saved to disk (Vercel read-only filesystem). access file.buffer to upload to S3.');
    const urls = files.map((f, index) => `https://placeholder.com/image-${index}.jpg`); 
    return this.offersService.addMedia(id, urls, user);
  }

  @Post(':id/upload/3d-videos')
  @UseInterceptors(FilesInterceptor('videos', 5)) // defaults to memory storage
  async upload3DVideos(@Param('id', ParseUUIDPipe) id: string, @UploadedFiles() files: Express.Multer.File[], @Request() req) {
    const user = getUserFromRequest(req);
    // WARNING: Same as above. Upload 'files' to cloud storage.
    console.warn('Videos received in memory. Upload to cloud storage required for persistence.');
    const urls = files.map((f, index) => `https://placeholder.com/video-${index}.mp4`);
    return this.offersService.addThreeDVideos(id, urls, user);
  }

  @Post(':id/purchase')
  async createPurchase(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const user = getUserFromRequest(req);
    return this.offersService.createPurchaseRequest(id, user);
  }

  @Post(':id/visit')
  async createVisit(@Param('id', ParseUUIDPipe) id: string, @Body() body: any, @Request() req) {
    const user = getUserFromRequest(req);
    return this.offersService.createVisitRequest(id, user, body);
  }
}
