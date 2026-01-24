// src/chat/interfaces/chat.interface.ts
import { User } from '../user/user-entity';
import { Role } from '../user/user-entity';
import { CreateRoomDto, SendMessageDto } from './create-room.dto';

export interface SocketUser {
  userId: string;
  email: string;
  firstName?: string;
  role: Role;
  socketId: string;
}

export interface RoomUser {
  userId: string;
  socketId: string;
  joinedAt: Date;
  isTyping: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  roomId: string;
  sender: {
    id: string;
    firstName: string;
    email: string;
    role: Role;
  };
  createdAt: Date;
  isEdited: boolean;
  editedAt?: Date;
  replyTo?: string;
}

export interface RoomData {
  id: string;
  name: string;
  description?: string;
  participants: string[];
  isGroup: boolean;
  isPublic: boolean;
  createdAt: Date;
  createdBy: string;
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

export interface TypingData {
  roomId: string;
  userId: string;
  firstName: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface JoinRoomData {
  roomId: string;
  user: {
    id: string;
    firstName: string;
    email: string;
    role: Role;
  };
  timestamp: Date;
}

export interface LeaveRoomData {
  roomId: string;
  userId: string;
  timestamp: Date;
}

// Events interface
export interface ServerToClientEvents {
  // Room events
  'roomJoined': (data: RoomData) => void;
  'roomLeft': (data: { roomId: string }) => void;
  'userJoined': (data: JoinRoomData) => void;
  'userLeft': (data: LeaveRoomData) => void;
  'roomCreated': (data: RoomData) => void;
  'roomUpdated': (data: Partial<RoomData>) => void;
  'roomDeleted': (data: { roomId: string }) => void;

  // Message events
  'receiveMessage': (data: ChatMessage) => void;
  'messageSent': (data: ChatMessage) => void;
  'messageUpdated': (data: Partial<ChatMessage> & { id: string }) => void;
  'messageDeleted': (data: { messageId: string; deletedBy: string }) => void;

  // Typing events
  'userTyping': (data: TypingData) => void;

  // Status events
  'onlineUsers': (data: { roomId: string; users: string[] }) => void;
  'userOnline': (data: { userId: string }) => void;
  'userOffline': (data: { userId: string }) => void;

  // Error events
  'error': (data: { message: string; code?: string }) => void;
  'unauthorized': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  // Connection
  'authenticate': (data: { token: string }) => void;

  // Room events
  'joinRoom': (data: { roomId: string }) => void;
  'leaveRoom': (data: { roomId: string }) => void;
  'createRoom': (data: CreateRoomDto) => void;

  // Message events
  'sendMessage': (data: SendMessageDto) => void;
  'editMessage': (data: { messageId: string; content: string }) => void;
  'deleteMessage': (data: { messageId: string; roomId: string }) => void;

  // Typing events
  'typing': (data: { roomId: string; isTyping: boolean }) => void;

  // Status events
  'getOnlineUsers': (data: { roomId: string }) => void;
  'markAsRead': (data: { roomId: string; messageId?: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: {
    userId: string;
    email: string;
    firstName?: string;
    role: Role;
  };
  rooms: Set<string>;
  joinedAt: Date;
}