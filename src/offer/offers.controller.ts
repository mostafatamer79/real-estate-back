import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, ParseUUIDPipe, UseInterceptors, UploadedFiles,
  ParseFilePipe, MaxFileSizeValidator, FileTypeValidator
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OffersService } from './offers.service';
import { CreateOfferDto,UpdateOfferDto } from './create-offer.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Multer } from 'multer';
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  create(@Body() createOfferDto: CreateOfferDto) {
    return this.offersService.create(createOfferDto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('propertyType') propertyType?: string,
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.offersService.findAll({
      status,
      propertyType,
      city,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      isActive: isActive !== undefined ? isActive === true : undefined,
    });
  }

  @Get('search')
  search(@Query('q') searchTerm: string) {
    return this.offersService.search(searchTerm);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.offersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOfferDto: UpdateOfferDto,
  ) {
    return this.offersService.update(id, updateOfferDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
  ) {
    return this.offersService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.offersService.remove(id);
  }

  @Delete(':id/hard')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.offersService.delete(id);
  }

  // File upload endpoints
  @Post(':id/upload/media')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/media',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
    }),
  )
  async uploadMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|mp4|mov|avi)$/ }),
        ],
      }),
    ) files: Express.Multer.File[],
  ) {
    const fileUrls = files.map(file => `/uploads/media/${file.filename}`);
    return this.offersService.addMedia(id, fileUrls);
  }

  @Post(':id/upload/3d-videos')
  @UseInterceptors(
    FilesInterceptor('videos', 5, {
      storage: diskStorage({
        destination: './uploads/3d-videos',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
    }),
  )
  async upload3DVideos(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 100 }), // 100MB
          new FileTypeValidator({ fileType: /(mp4|mov|avi|webm)$/ }),
        ],
      }),
    ) files: Express.Multer.File[],
  ) {
    const videoUrls = files.map(file => `/uploads/3d-videos/${file.filename}`);
    return this.offersService.addThreeDVideos(id, videoUrls);
  }
}