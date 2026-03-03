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
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private chatService: ChatService) {}

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string || client.handshake.auth.userId;
      if (userId) {
        this.connectedUsers.set(userId, client.id);
        console.log(`User ${userId} connected`);
        
        // Broadcast online status to all connected clients (or specifically to relevant rooms if optimized)
        // For simplicity, we broadcast to everyone or let clients check
        this.server.emit('userStatus', { userId, status: 'online' });
      }
    } catch (error) {
      console.error('Connection error:', error);
    }
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
      client.join(data.roomId);
      console.log(`Socket ${client.id} joined room ${data.roomId}`);
    } catch (error) {
      console.error('Join room error:', error);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; senderId: string; content: string },
  ) {
    try {
      // Save message to database
      const message = await this.chatService.sendMessage(
        data.roomId,
        data.senderId,
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
      console.error('Send message error:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }
}