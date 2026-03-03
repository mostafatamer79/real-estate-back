import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../user/user-entity';

export enum MarketingCategory {
  ORDERS = 'orders', // الطلبات
  OFFERS = 'offers', // العروض
  PROPERTY_MANAGEMENT = 'property_management', // إدارة الأملاك
}

export enum MarketingFrequency {
  DAILY = 'daily',
  EVERY_2_DAYS = 'every_2_days',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
}

@Entity('email_marketing')
export class EmailMarketing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MarketingCategory,
  })
  category: MarketingCategory;

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true })
  linkedResourceType: string; // 'none', 'order', 'appointment', 'offer', 'property'

  @Column({ nullable: true })
  linkedResourceId: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: MarketingFrequency,
    default: MarketingFrequency.WEEKLY,
  })
  frequency: MarketingFrequency;

  @Column({
    type: 'enum',
    enum: Role,
    nullable: true,
  })
  targetRole: Role; // All users if null, or specific role like AGENT

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastSentAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
