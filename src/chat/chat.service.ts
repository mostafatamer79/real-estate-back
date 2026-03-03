// src/chat/chat.service.ts - Simplified version
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, ChatRoom } from './message.entity';
import { User } from '../user/user-entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationType } from '../notification/notification.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
    private notificationGateway: NotificationGateway,
  ) {}

async getRoomById(roomId: string) {
  return this.chatRoomRepository.findOne({
    where: { id: roomId },
    relations: ['participants'],
  });
}

// Also update getOrCreateOfferChat to include offerTitle
async getOrCreateOfferChat(offerId: string, buyerId: string, sellerId: string, offerTitle?: string) {
  // Check if room already exists
    let room = await this.chatRoomRepository.findOne({
      where: { offerId, createdBy: buyerId },
      relations: ['participants'],
    });

  if (!room) {
    // Get buyer and seller
    const buyer = await this.userRepository.findOne({ where: { id: buyerId } });
    const seller = await this.userRepository.findOne({ where: { id: sellerId } });

    if (!buyer || !seller) {
      throw new Error('User not found');
    }

    // Create new chat room
    room = this.chatRoomRepository.create({
      name: offerTitle || `Chat for Offer ${offerId.substring(0, 8)}`,
      description: `محادثة حول العرض: ${offerTitle || offerId}`,
      participants: [buyer, seller],
      createdBy: buyerId,
      offerId,
      isGroup: false,
    });

    await this.chatRoomRepository.save(room);
  }

  return room;
}

async getOrCreateOrderChat(orderId: string, userId: string, otherId: string, title?: string) {
    let room = await this.chatRoomRepository.findOne({
        where: { orderId, createdBy: userId },
        relations: ['participants'],
    });

    if (!room) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        const other = await this.userRepository.findOne({ where: { id: otherId } });

        if (!user || !other) throw new Error('User not found');

        room = this.chatRoomRepository.create({
            name: title || `Order #${orderId.substring(0, 8)}`,
            description: `Chat for Order ${orderId}`,
            participants: [user, other],
            createdBy: userId,
            orderId,
            isGroup: false,
        });

        await this.chatRoomRepository.save(room);
    }
    return room;
}

async getOrCreateDisputeChat(disputeId: string, userId: string, otherId: string, title?: string) {
    let room = await this.chatRoomRepository.findOne({
        where: { disputeId, createdBy: userId },
        relations: ['participants'],
    });

    if (!room) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        const other = await this.userRepository.findOne({ where: { id: otherId } });

        if (!user || !other) throw new Error('User not found');

        room = this.chatRoomRepository.create({
            name: title || `Dispute #${disputeId.substring(0, 8)}`,
            description: `Chat for Dispute ${disputeId}`,
            participants: [user, other],
            createdBy: userId,
            disputeId,
            isGroup: false,
        });

        await this.chatRoomRepository.save(room);
    }
    return room;
}

  // Send message
  async sendMessage(roomId: string, senderId: string, content: string) {
    const room = await this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: ['participants']
    });

    const sender = await this.userRepository.findOne({ where: { id: senderId } });

    if (!room || !sender) {
      throw new Error('Room or sender not found');
    }

    const message = this.messageRepository.create({
      content,
      sender,
      room,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Filter recipients (everyone in room except sender)
    const recipients = room.participants.filter(p => p.id !== senderId);

    // Send notifications
    for (const recipient of recipients) {
      const notification = await this.notificationService.create(
        recipient.id,
        NotificationType.CHAT,
        `رسالة جديدة من ${sender.firstName}`,
        content.length > 50 ? content.substring(0, 50) + '...' : content,
        { 
          roomId: room.id, 
          senderId: sender.id,
          messageId: savedMessage.id 
        }
      );
      await this.notificationGateway.sendNotificationToUser(recipient.id, notification);
    }

    return savedMessage;
  }

  // Get messages for a room
  async getRoomMessages(roomId: string, limit = 50) {
    return this.messageRepository.find({
      where: { room: { id: roomId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  // Get user's chat rooms
  async getUserRooms(userId: string) {
    return this.chatRoomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.participants', 'participant')
      .leftJoinAndSelect('room.messages', 'message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('participant.id = :userId', { userId })
      .orderBy('message.createdAt', 'DESC')
      .getMany();
  }
}