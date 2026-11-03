// src/chat/chat.gateway.ts - Simplified
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { WsAuthGuard } from '../common/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
  namespace: '/chat',
})
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private chatService: ChatService) {}

  async handleConnection(client: Socket) {
    // Authentication is enforced on every message handler by WsAuthGuard.
    // Do not trust query-string identity during the unauthenticated handshake.
    void client;
  }

  handleDisconnect(client: Socket) {
    // Remove user from connected users
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        this.server.emit('userStatus', { userId, status: 'offline' });
        break;
      }
    }
  }

  @SubscribeMessage('checkUserStatus')
  handleCheckUserStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const userId = client.data.user?.id;
    if (userId) this.connectedUsers.set(userId, client.id);
    const isOnline = this.connectedUsers.has(data.userId);
    client.emit('userStatus', { 
      userId: data.userId, 
      status: isOnline ? 'online' : 'offline' 
    });
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      await this.chatService.getRoomById(data.roomId).then((room) => {
        if (!room?.participants.some((participant) => participant.id === client.data.user?.id)) {
          throw new Error('User is not a room participant');
        }
      });
      client.join(data.roomId);
      console.log(`Socket ${client.id} joined room ${data.roomId}`);
    } catch (error) {
      console.error('Join room error:', error);
      client.emit('error', { message: 'Not authorized to join this room' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; content: string },
  ) {
    try {
      // Save message to database
      const message = await this.chatService.sendMessage(
        data.roomId,
        client.data.user.id,
        data.content,
      );

      // Broadcast to room
      this.server.to(data.roomId).emit('receiveMessage', {
        type: 'receiveMessage',
        message: {
          id: message.id,
          content: message.content,
          sender: {
            id: message.sender.id,
            firstName: message.sender.firstName,
            lastName: message.sender.lastName,
            email: message.sender.email,
          },
          createdAt: message.createdAt,
        }
      });

    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', error.getResponse());
        return;
      }
      console.error('Send message error:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }
}
