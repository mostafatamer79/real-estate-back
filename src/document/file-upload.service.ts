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
    this.uploadPath = join(process.cwd(), 'uploads');
    if (!existsSync(this.uploadPath)) mkdirSync(this.uploadPath, { recursive: true });
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
