// src/document/document.service.ts
import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException
  } from '@nestjs/common';
import { Multer } from 'multer';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { Document, DocumentStatus, DocumentType } from './document.entity';
  import { User, Role } from '../user/user-entity';
  import { FileUploadService } from './file-upload.service';

  @Injectable()
  export class DocumentService {
    constructor(
      @InjectRepository(Document)
      private readonly documentRepository: Repository<Document>,
      private readonly fileUploadService: FileUploadService,
    ) {}

    async uploadDocument(
      file:  Express.Multer.File ,
      createDto: {
        title: string;
        description?: string;
        type: DocumentType;
        recipientId: string;
        folder?: string;
        requiresSignature?: boolean;
        expiresAt?: Date;
        tags?: string[];
      },
      uploadedBy: User
    ): Promise<Document> {
      // Check if recipient exists and user has permission to send documents
      if (uploadedBy.role !== Role.AGENT && uploadedBy.role !== Role.ADMIN) {
        throw new ForbiddenException('Only agents and admins can upload documents');
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException('File size cannot exceed 10MB');
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException('Unsupported file type');
      }

      // Upload file to S3
      const uploadResult = await this.fileUploadService.uploadFile(file, createDto.folder || 'documents');

      // Create document record
      const document = this.documentRepository.create({
        title: createDto.title,
        description: createDto.description,
        type: createDto.type,
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType,
        recipientId: createDto.recipientId,
        uploadedById: uploadedBy.id,
        folder: createDto.folder,
        requiresSignature: createDto.requiresSignature || false,
        expiresAt: createDto.expiresAt,
        tags: createDto.tags || [],
      });

      return await this.documentRepository.save(document);
    }

    async getDocuments(user: User, filters?: {
      type?: DocumentType;
      status?: DocumentStatus;
      folder?: string;
      search?: string;
      startDate?: Date;
      endDate?: Date;
    }): Promise<Document[]> {
      let query = this.documentRepository.createQueryBuilder('document')
        .leftJoinAndSelect('document.uploadedBy', 'uploadedBy')
        .leftJoinAndSelect('document.recipient', 'recipient')
        .orderBy('document.createdAt', 'DESC');

      // Apply user-specific filters
      if (user.role === Role.USER) {
        query = query.where('document.recipientId = :userId', { userId: user.id });
      } else if (user.role === Role.AGENT) {
        query = query.where('document.uploadedById = :agentId', { agentId: user.id });
      } else {
        query = query.where('1=1');
      }

      // Apply additional filters
      if (filters?.type) {
        query = query.andWhere('document.type = :type', { type: filters.type });
      }

      if (filters?.status) {
        query = query.andWhere('document.status = :status', { status: filters.status });
      }

      if (filters?.folder) {
        query = query.andWhere('document.folder = :folder', { folder: filters.folder });
      }

      if (filters?.search) {
        query = query.andWhere(
          '(document.title LIKE :search OR document.description LIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      if (filters?.startDate) {
        query = query.andWhere('document.createdAt >= :startDate', { startDate: filters.startDate });
      }

      if (filters?.endDate) {
        query = query.andWhere('document.createdAt <= :endDate', { endDate: filters.endDate });
      }

      return await query.getMany();
    }

    async getDocument(id: string, user: User): Promise<Document> {
      const document = await this.documentRepository.findOne({
        where: { id },
        relations: ['uploadedBy', 'recipient']
      });

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      // Check permissions
      if (
        user.role !== Role.ADMIN &&
        document.uploadedById !== user.id &&
        document.recipientId !== user.id
      ) {
        throw new ForbiddenException('You do not have permission to access this document');
      }

      // Increment view count
      document.viewCount += 1;
      await this.documentRepository.save(document);

      return document;
    }

    async updateDocumentStatus(id: string, status: DocumentStatus, user: User): Promise<Document> {
      const document = await this.getDocument(id, user);

      // Only recipients or admins can update status
      if (document.recipientId !== user.id && user.role !== Role.ADMIN) {
        throw new ForbiddenException('Only document recipients can update status');
      }

      document.status = status;

      if (status === DocumentStatus.APPROVED && document.requiresSignature) {
        document.signedAt = new Date();
      }

      return await this.documentRepository.save(document);
    }

    async signDocument(id: string, signatureFile: Express.Multer.File , user: User): Promise<Document> {
      const document = await this.getDocument(id, user);

      if (!document.requiresSignature) {
        throw new BadRequestException('This document does not require a signature');
      }

      if (document.recipientId !== user.id) {
        throw new ForbiddenException('Only the recipient can sign this document');
      }

      // Upload signature file
      const uploadResult = await this.fileUploadService.uploadFile(signatureFile, 'signatures');

      document.signatureUrl = uploadResult.fileUrl;
      document.signedAt = new Date();
      document.status = DocumentStatus.APPROVED;

      return await this.documentRepository.save(document);
    }


    async deleteDocument(id: string, user: User): Promise<void> {
      const document = await this.getDocument(id, user);

      // Only uploader or admin can delete
      if (document.uploadedById !== user.id && user.role !== Role.ADMIN) {
        throw new ForbiddenException('Only the uploader can delete this document');
      }

      // Extract file key from URL
      const fileKey = document.fileUrl.split('/').pop();
      if (fileKey) {
        await this.fileUploadService.deleteFile(`documents/${fileKey}`);
      }

      await this.documentRepository.remove(document);
    }

    async getDocumentStats(user: User) {
      const stats = await this.documentRepository
        .createQueryBuilder('document')
        .select([
          'document.type as type',
          'COUNT(document.id) as count',
          'SUM(document.downloadCount) as totalDownloads',
          'SUM(document.viewCount) as totalViews'
        ])
        .where(user.role === Role.USER ? 'document.recipientId = :userId' : 'document.uploadedById = :userId', { userId: user.id })
        .groupBy('document.type')
        .getRawMany();

      const total = await this.documentRepository.count({
        where: user.role === Role.USER
          ? { recipientId: user.id }
          : { uploadedById: user.id }
      });

      const pending = await this.documentRepository.count({
        where: {
          status: DocumentStatus.PENDING,
          ...(user.role === Role.USER ? { recipientId: user.id } : { uploadedById: user.id })
        }
      });

      return {
        total,
        pending,
        byType: stats,
      };
    }

    async createFolder(folderName: string, user: User): Promise<void> {
      // In a real implementation, you might want to create folder structure in S3
      // For now, we'll just track folder names in the database
      const existingFolders = await this.getFolders(user);

      if (existingFolders.includes(folderName)) {
        throw new BadRequestException('Folder already exists');
      }
    }

    async getFolders(user: User): Promise<string[]> {
      const result = await this.documentRepository
        .createQueryBuilder('document')
        .select('DISTINCT document.folder', 'folder')
        .where(user.role === Role.AGENT ? 'document.uploadedById = :userId' : 'document.recipientId = :userId', { userId: user.id })
        .andWhere('document.folder IS NOT NULL')
        .orderBy('document.folder', 'ASC')
        .getRawMany();

      return result.map(item => item.folder);
    }
  }