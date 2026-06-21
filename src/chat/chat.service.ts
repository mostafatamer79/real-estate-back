// src/chat/chat.service.ts - Simplified version
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Message, ChatRoom } from './message.entity';
import { User, Role } from '../user/user-entity';
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

  async createRoom(data: { name: string; description?: string; userIds: string[]; isGroup?: boolean; isPublic?: boolean; serviceRequestId?: string; offerId?: string; orderId?: string; disputeId?: string }, creator: User) {
    const participants = await this.userRepository.find({
      where: { id: (require('typeorm').In)(data.userIds) }
    });

    const room = this.chatRoomRepository.create({
      name: data.name,
      description: data.description,
      participants,
      createdBy: creator.id,
      isGroup: data.isGroup ?? false,
      isPublic: data.isPublic ?? false,
      serviceRequestId: data.serviceRequestId,
      offerId: data.offerId,
      orderId: data.orderId,
      disputeId: data.disputeId,
    });

    return await this.chatRoomRepository.save(room);
  }

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
        let other: User | null = null;

        if (otherId && otherId !== 'admin' && otherId !== 'null' && otherId !== 'undefined') {
            other = await this.userRepository.findOne({ where: { id: otherId } });
        }

        if (!other) {
            other = await this.userRepository.findOne({
                where: [
                    { role: Role.ADMIN },
                    { role: Role.MANGER }
                ]
            });
        }

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

async getOrCreateServiceRequestChat(serviceRequestId: string, userId: string, clientId: string, title?: string) {
    let room = await this.chatRoomRepository.findOne({
        where: { serviceRequestId, createdBy: userId },
        relations: ['participants'],
    });

    if (!room) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        const client = await this.userRepository.findOne({ where: { id: clientId } });

        if (!user || !client) throw new Error('User or Client not found');

        room = this.chatRoomRepository.create({
            name: title || `Service Request #${serviceRequestId.substring(0, 8)}`,
            description: `محادثة حول طلب الخدمة: ${title || serviceRequestId}`,
            participants: [user, client],
            createdBy: userId,
            serviceRequestId,
            isGroup: false,
        });

        await this.chatRoomRepository.save(room);
    }
    return room;
}

async getOrCreateDirectChat(userId1: string, userId2: string) {
    const rooms = await this.chatRoomRepository.createQueryBuilder('room')
        .leftJoinAndSelect('room.participants', 'participant')
        .where('room.isGroup = :isGroup', { isGroup: false })
        .andWhere('room.offerId IS NULL')
        .andWhere('room.orderId IS NULL')
        .andWhere('room.serviceRequestId IS NULL')
        .andWhere('room.disputeId IS NULL')
        .getMany();

    let room = rooms.find(r => {
        const pIds = r.participants.map(p => p.id);
        return pIds.includes(userId1) && pIds.includes(userId2) && pIds.length === 2;
    });

    if (!room) {
        const user1 = await this.userRepository.findOne({ where: { id: userId1 } });
        const user2 = await this.userRepository.findOne({ where: { id: userId2 } });

        if (!user1 || !user2) throw new Error('User not found');

        room = this.chatRoomRepository.create({
            name: `محادثة مباشرة`,
            description: `Direct chat between ${user1.firstName} and ${user2.firstName}`,
            participants: [user1, user2],
            createdBy: userId1,
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

  // Get messages for a room (marks them as read if userId is provided)
  async getRoomMessages(roomId: string, limit = 50, userId?: string) {
    if (userId) {
      await this.messageRepository
        .createQueryBuilder()
        .update(Message)
        .set({ isRead: true })
        .where('roomId = :roomId AND senderId != :userId AND isRead = false', { roomId, userId })
        .execute();

      // Mark matching chat notifications as read
      await this.notificationService.markChatNotificationsAsRead(roomId, userId);
    }

    return this.messageRepository.find({
      where: { room: { id: roomId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  // Get unread messages count for a specific room and user
  async getUnreadCount(roomId: string, userId: string): Promise<number> {
    const count = await this.messageRepository.count({
      where: {
        room: { id: roomId },
        sender: { id: Not(userId) },
        isRead: false,
      }
    });

    if (count === 0) {
      await this.notificationService.markChatNotificationsAsRead(roomId, userId);
    }

    return count;
  }

  // Mark all messages in a room as read for a user
  async markRoomAsRead(roomId: string, userId: string) {
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('roomId = :roomId AND senderId != :userId AND isRead = false', { roomId, userId })
      .execute();

    // Mark matching chat notifications as read
    await this.notificationService.markChatNotificationsAsRead(roomId, userId);
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