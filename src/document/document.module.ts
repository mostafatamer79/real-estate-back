// src/document/document.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './document.entity';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { FileUploadService } from './file-upload.service';
import { DepartmentsGuard } from '../common/guards/departments.guard';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Document]), SettingsModule],
  controllers: [DocumentController],
  providers: [DocumentService, FileUploadService, DepartmentsGuard],
  exports: [DocumentService, FileUploadService]
})
export class DocumentModule {}
