import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role, User } from '../../user/user-entity';

export enum MarketingCategory {
  ORDERS = 'orders', // الطلبات
  OFFERS = 'offers', // العروض
  PROPERTY_MANAGEMENT = 'property_management', // إدارة الأملاك
  CUSTOM = 'custom', // مخصص
}

export enum MarketingFrequency {
  DAILY = 'daily',
  EVERY_2_DAYS = 'every_2_days',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
}

export enum MarketingScheduleMode {
  MANUAL = 'manual',
  DATE_RANGE = 'date_range',
}

@Entity('email_marketing')
export class EmailMarketing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  ownerId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

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

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({
    type: 'enum',
    enum: MarketingScheduleMode,
    default: MarketingScheduleMode.MANUAL,
  })
  scheduleMode: MarketingScheduleMode;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

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

  @Column({ nullable: true })
  propertyType: string;

  @Column({ nullable: true })
  mainCategory: string;

  @Column({ nullable: true })
  dealType: string;

  @Column('decimal', { nullable: true })
  price: number;

  @Column('decimal', { nullable: true })
  area: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  neighborhood: string;

  @Column('simple-array', { nullable: true })
  mediaFiles: string[];

  @Column({ type: 'timestamp', nullable: true })
  lastSentAt: Date;

  @Column({ default: 0 })
  totalSent: number;

  @Column({ default: 0 })
  openCount: number;

  @Column({ default: 0 })
  clickCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
