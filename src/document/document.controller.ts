// src/document/document.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  ParseUUIDPipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { FileUploadService } from './file-upload.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorators';
import { DocumentType, DocumentStatus } from './document.entity';
import { Role } from '../user/user-entity';
import type { Multer } from 'multer';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post('upload')
  @Roles([Role.ADMIN,Role.AGENT])
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File
,
    @Body() body: any,
    @Request() req
  ) {
    const createDto = {
      title: body.title,
      description: body.description,
      type: body.type as DocumentType,
      recipientId: body.recipientId,
      folder: body.folder,
      requiresSignature: body.requiresSignature === 'true',
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      tags: body.tags ? JSON.parse(body.tags) : [],
    };

    return this.documentService.uploadDocument(file, createDto, req.user);
  }

  @Get()
  async getDocuments(
    @Request() req,
    @Query() query: {
      type?: DocumentType;
      status?: DocumentStatus;
      folder?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const filters = {
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    };

    return this.documentService.getDocuments(req.user, filters);
  }

  @Get('stats')
  async getStats(@Request() req) {
    return this.documentService.getDocumentStats(req.user);
  }

  @Get('folders')
  async getFolders(@Request() req) {
    return this.documentService.getFolders(req.user);
  }

  @Get(':id')
  async getDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ) {
    return this.documentService.getDocument(id, req.user);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: DocumentStatus,
    @Request() req
  ) {
    return this.documentService.updateDocumentStatus(id, status, req.user);
  }

  @Post(':id/sign')
  @UseInterceptors(FileInterceptor('signature'))
  async signDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() signatureFile:  Express.Multer.File ,
    @Request() req
  ) {
    return this.documentService.signDocument(id, signatureFile, req.user);
  }

  @Delete(':id')
  async deleteDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ) {
    return this.documentService.deleteDocument(id, req.user);
  }

  @Post('folders')
  @Roles([Role.ADMIN,Role.AGENT])
  async createFolder(
    @Body('name') folderName: string,
    @Request() req
  ) {
    return this.documentService.createFolder(folderName, req.user);
  }
}