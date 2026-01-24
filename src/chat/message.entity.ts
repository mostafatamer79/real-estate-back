// src/chat/entities/message.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user-entity';
import { Offer } from '../offer/offer-entity';

@Entity('chat_rooms')
@Index(['createdAt'])
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => User)
  @JoinTable()
  participants: User[];
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  createdByUser: User; // Renamed to avoid conflict

  // Keep string field for quick access if needed
  @Column()
  createdBy: string;

  @OneToMany(() => Message, message => message.room)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isGroup: boolean;

  @Column({ default: false })
  isPublic: boolean;

  @Column({nullable:true})
  offerId:string

  @Column({nullable:true})
  orderId: string;

  @Column({nullable:true})
  disputeId: string;
}
@Entity('messages')
@Index(['room', 'createdAt']) // Index for performance
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;

  @ManyToOne(() => ChatRoom, room => room.messages, { onDelete: 'CASCADE' })
  room: ChatRoom;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ nullable: true })
  editedAt: Date;
}


