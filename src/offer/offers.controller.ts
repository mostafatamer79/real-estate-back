
import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, ParseUUIDPipe, UseInterceptors, UploadedFiles, Request,
  UseGuards
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OffersService } from './offers.service';
import { CreateOfferDto, UpdateOfferDto } from './create-offer.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const user = getUserFromRequest(req);
    return this.offersService.findOne(id, user);
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
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: './uploads/media',
      filename: (req, file, cb) => {
        const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + extname(file.originalname);
        cb(null, name);
      },
    }),
  }))
  @Roles([Role.ADMIN, Role.AGENT,Role.USER])
  async uploadMedia(@Param('id', ParseUUIDPipe) id: string, @UploadedFiles() files: Express.Multer.File[], @Request() req) {
    const user = getUserFromRequest(req, [Role.ADMIN, Role.AGENT,Role.USER]);
    const urls = files.map(f => `/uploads/media/${f.filename}`);
    return this.offersService.addMedia(id, urls, user);
  }

  @Post(':id/upload/3d-videos')
  @Roles([Role.ADMIN, Role.AGENT,Role.USER])
  @UseInterceptors(FilesInterceptor('videos', 5, {
    storage: diskStorage({
      destination: './uploads/3d-videos',
      filename: (req, file, cb) => {
        const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + extname(file.originalname);
        cb(null, name);
      },
    }),
  }))
  async upload3DVideos(@Param('id', ParseUUIDPipe) id: string, @UploadedFiles() files: Express.Multer.File[], @Request() req) {
    const user = getUserFromRequest(req, [Role.ADMIN, Role.AGENT,Role.USER]);
    const urls = files.map(f => `/uploads/3d-videos/${f.filename}`);
    return this.offersService.addThreeDVideos(id, urls, user);
  }
}
