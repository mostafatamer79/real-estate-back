
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
import { Roles } from '../common/decorators/roles.decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../user/user-entity';
import { getUserFromRequest } from '../common/utils/request-user.util';

@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @Roles([Role.ADMIN, Role.AGENT,Role.USER])
  create(@Body() dto: CreateOfferDto, @Request() req) {
    const user = getUserFromRequest(req, [Role.ADMIN, Role.AGENT,Role.USER]);
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

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const user = getUserFromRequest(req);
    return this.offersService.findOne(id, user);
  }

  @Post(':id/view')
  @Roles([Role.USER, Role.AGENT, Role.ADMIN])
  async incrementView(@Param('id', ParseUUIDPipe) id: string, @Ip() ip: string) {
    return this.offersService.incrementViewCount(id, ip);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOfferDto, @Request() req) {
    const user = getUserFromRequest(req, [Role.ADMIN, Role.AGENT, Role.USER]);
    // Note: The service should likely check ownership if role is USER
    return this.offersService.update(id, dto, user);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: string, @Request() req) {
    const user = getUserFromRequest(req, [Role.ADMIN]);
    return this.offersService.updateStatus(id, status, user);
  }

  @Delete(':id')
  @Roles([Role.ADMIN, Role.AGENT, Role.USER])
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const user = getUserFromRequest(req, [Role.ADMIN, Role.AGENT, Role.USER]);
    return this.offersService.remove(id, user); // Soft delete
  }

  @Delete(':id/hard')
  @Roles([Role.ADMIN])
  delete(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const user = getUserFromRequest(req, [Role.ADMIN]);
    return this.offersService.delete(id, user); // Hard delete
  }

  // File uploads
  @Post(':id/upload/media')
  @UseInterceptors(FilesInterceptor('files', 10)) // defaults to memory storage
  @Roles([Role.ADMIN, Role.AGENT,Role.USER])
  async uploadMedia(@Param('id', ParseUUIDPipe) id: string, @UploadedFiles() files: Express.Multer.File[], @Request() req) {
    const user = getUserFromRequest(req, [Role.ADMIN, Role.AGENT,Role.USER]);
    // WARNING: In a real Vercel deployment, you must upload 'files' (which are in memory) to S3/Cloudinary here.
    // For now, we return a placeholder URL to prevent crashing.
    console.warn('Files received in memory but not saved to disk (Vercel read-only filesystem). access file.buffer to upload to S3.');
    const urls = files.map((f, index) => `https://placeholder.com/image-${index}.jpg`); 
    return this.offersService.addMedia(id, urls, user);
  }

  @Post(':id/upload/3d-videos')
  @Roles([Role.ADMIN, Role.AGENT,Role.USER])
  @UseInterceptors(FilesInterceptor('videos', 5)) // defaults to memory storage
  async upload3DVideos(@Param('id', ParseUUIDPipe) id: string, @UploadedFiles() files: Express.Multer.File[], @Request() req) {
    const user = getUserFromRequest(req, [Role.ADMIN, Role.AGENT,Role.USER]);
    // WARNING: Same as above. Upload 'files' to cloud storage.
    console.warn('Videos received in memory. Upload to cloud storage required for persistence.');
    const urls = files.map((f, index) => `https://placeholder.com/video-${index}.mp4`);
    return this.offersService.addThreeDVideos(id, urls, user);
  }

  @Post(':id/purchase')
  @Roles([Role.USER, Role.AGENT, Role.ADMIN])
  async createPurchase(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const user = getUserFromRequest(req, [Role.USER, Role.AGENT, Role.ADMIN]);
    return this.offersService.createPurchaseRequest(id, user);
  }

  @Post(':id/visit')
  @Roles([Role.USER, Role.AGENT, Role.ADMIN])
  async createVisit(@Param('id', ParseUUIDPipe) id: string, @Body() body: any, @Request() req) {
    const user = getUserFromRequest(req, [Role.USER, Role.AGENT, Role.ADMIN]);
    return this.offersService.createVisitRequest(id, user, body);
  }
}
