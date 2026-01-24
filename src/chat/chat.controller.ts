// src/chat/chat.controller.ts - Updated
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Get or create offer chat room
  @Post('rooms/offer')
  async getOrCreateOfferRoom(
    @Body() data: {
      offerId: string;
      sellerId: string;
      offerTitle: string;
    },
    @Request() req,
  ) {
    return this.chatService.getOrCreateOfferChat(
      data.offerId,
      req.user.userId, // buyerId
      data.sellerId,
      data.offerTitle,
    );
  }

  @Post('rooms/order')
  async getOrCreateOrderRoom(
    @Body() data: { orderId: string; otherId: string; title: string },
    @Request() req,
  ) {
    return this.chatService.getOrCreateOrderChat(
      data.orderId,
      req.user.userId,
      data.otherId,
      data.title,
    );
  }

  @Post('rooms/dispute')
  async getOrCreateDisputeRoom(
    @Body() data: { disputeId: string; otherId: string; title: string },
    @Request() req,
  ) {
    return this.chatService.getOrCreateDisputeChat(
      data.disputeId,
      req.user.userId,
      data.otherId,
      data.title,
    );
  }

  // Get room messages
  @Get('rooms/:roomId/messages')
  async getRoomMessages(
    @Param('roomId') roomId: string,
    @Query('limit') limit: any = 50,
  ) {
    return this.chatService.getRoomMessages(roomId, parseInt(limit));
  }

  // Send message
  @Post('rooms/:roomId/messages')
  async sendMessage(
    @Param('roomId') roomId: string,
    @Body() data: { content: string },
    @Request() req,
  ) {
    return this.chatService.sendMessage(roomId, req.user.userId, data.content);
  }

  // Get user's chat rooms
  @Get('rooms')
  async getUserRooms(@Request() req) {
    const rooms = await this.chatService.getUserRooms(req.user.userId);

    // Transform rooms to include other participant info
    const transformedRooms = await Promise.all(
      rooms.map(async (room) => {
        // Get other participant
        const otherParticipant = room.participants?.find(
          (p) => p.id !== req.user.userId,
        );

        // Get last message
        const messages = await this.chatService.getRoomMessages(room.id, 1);
        const lastMessage = messages[0];

        return {
          id: room.id,
          name: room.name,
          offerId: room.offerId,
          participants: room.participants?.map(p => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email,
          })),
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            sender: {
              id: lastMessage.sender.id,
              firstName: lastMessage.sender.firstName,
              lastName: lastMessage.sender.lastName,
            },
            createdAt: lastMessage.createdAt,
          } : null,
          createdAt: room.createdAt,
        };
      }),
    );

    return {
      success: true,
      data: transformedRooms,
      count: transformedRooms.length,
    };
  }

  // Get specific room
  @Get('rooms/:roomId')
  async getRoom(
    @Param('roomId') roomId: string,
    @Request() req,
  ) {
    const room = await this.chatService.getRoomById(roomId);

    // Check if user is participant
    const isParticipant = room?.participants?.some(
      (p) => p.id === req.user.userId,
    );

    if (!isParticipant) {
      throw new Error('Not authorized to access this room');
    }

    return room;
  }
}