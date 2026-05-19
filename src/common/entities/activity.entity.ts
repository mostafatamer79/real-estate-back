import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ActivityType {
  USER_JOINED = 'user_joined',
  PROPERTY_ADDED = 'property_added',
  ORDER_PLACED = 'order_placed',
  PAYMENT_RECEIVED = 'payment_received',
  BOOKING_MADE = 'booking_made',
  SYSTEM = 'system',
}

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
    default: ActivityType.SYSTEM,
  })
  type: ActivityType;

  @Column({ nullable: true })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
