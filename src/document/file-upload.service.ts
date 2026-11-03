import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { isAbsolute, join, normalize, sep } from 'path';
import { v4 as uuidv4 } from 'uuid';
// Use Express.Multer.File type for file handling
import { Request } from 'express';

@Injectable()
export class FileUploadService {
  private uploadPath: string;

  constructor() {
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.cwd().startsWith('/var/task');
    const basePath = isServerless ? '/tmp' : process.cwd();
    this.uploadPath = join(basePath, 'uploads');
    
    // In serverless, we must use /tmp. In local, we use cwd.
    // We only attempt to create the directory if it doesn't exist.
    if (!existsSync(this.uploadPath)) {
        try {
            mkdirSync(this.uploadPath, { recursive: true });
        } catch (error) {
            console.error(`Failed to create upload directory at ${this.uploadPath}:`, error);
            // Fallback to /tmp just in case we were wrong about the environment
            if (basePath !== '/tmp') {
                 console.warn('Falling back to /tmp/uploads');
                 this.uploadPath = join('/tmp', 'uploads');
                 if (!existsSync(this.uploadPath)) mkdirSync(this.uploadPath, { recursive: true });
            }
        }
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'documents') {
    try {
      if (!file?.buffer || !file.originalname) {
        throw new BadRequestException('A file is required');
      }
      const safeFolder = normalize(folder).replaceAll('\\', '/');
      if (
        isAbsolute(safeFolder) ||
        safeFolder === '..' ||
        safeFolder.startsWith('../') ||
        safeFolder.includes('/../') ||
        !/^[a-z0-9][a-z0-9_-]*$/i.test(safeFolder)
      ) {
        throw new BadRequestException('Invalid upload folder');
      }
      const allowedExtensions = new Set(['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx']);
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedExtensions.has(fileExtension)) {
        throw new BadRequestException('Unsupported file type');
      }
      if (!Number.isFinite(file.size) || file.size <= 0 || file.size > 10 * 1024 * 1024) {
        throw new BadRequestException('File must be between 1 byte and 10 MB');
      }
      const allowedMimeTypes: Record<string, string[]> = {
        pdf: ['application/pdf'],
        png: ['image/png'],
        jpg: ['image/jpeg'],
        jpeg: ['image/jpeg'],
        doc: ['application/msword', 'application/octet-stream'],
        docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream'],
        xls: ['application/vnd.ms-excel', 'application/octet-stream'],
        xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'],
      };
      if (!allowedMimeTypes[fileExtension].includes(file.mimetype)) {
        throw new BadRequestException('File content type does not match its extension');
      }
      const fileName = `${uuidv4()}.${fileExtension}`;
      const folderPath = join(this.uploadPath, safeFolder);
      const uploadRoot = normalize(this.uploadPath + sep);
      if (!normalize(folderPath + sep).startsWith(uploadRoot)) {
        throw new BadRequestException('Invalid upload folder');
      }
      if (!existsSync(folderPath)) mkdirSync(folderPath, { recursive: true });
      const filePath = join(folderPath, fileName);
      writeFileSync(filePath, file.buffer);

      return {
        fileName: file.originalname,
        fileUrl: `/uploads/${safeFolder}/${fileName}`,
        filePath,
        fileSize: file.size,
        fileType: file.mimetype,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error uploading file:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  async deleteFile(filePath: string) {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        return { success: true, message: 'File deleted successfully' };
      } else {
        throw new BadRequestException('File does not exist');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new BadRequestException('Failed to delete file');
    }
  }
}
