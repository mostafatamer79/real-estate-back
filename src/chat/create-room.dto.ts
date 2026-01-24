// src/chat/dto/create-room.dto.ts
import { IsString, IsArray, IsOptional, IsBoolean,MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isGroup?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublic?: boolean = false;
}

// src/chat/dto/join-room.dto.ts

export class JoinRoomDto {
  @IsString()
  roomId: string;

  @IsOptional()
  @IsString()
  password?: string;
}

// src/chat/dto/send-message.dto.ts

export class SendMessageDto {
  @IsString()
  roomId: string;

  @IsString()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  replyTo?: string;
}