import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
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
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const folderPath = join(this.uploadPath, folder);
      if (!existsSync(folderPath)) mkdirSync(folderPath, { recursive: true });
      const filePath = join(folderPath, fileName);
      writeFileSync(filePath, file.buffer);

      return {
        fileName: file.originalname,
        fileUrl: `/uploads/${folder}/${fileName}`,
        filePath,
        fileSize: file.size,
        fileType: file.mimetype,
      };
    } catch (error) {
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
