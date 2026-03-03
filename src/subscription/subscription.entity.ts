import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user-entity';
import { Property } from '../property/entities/property.entity';
import { Unit } from '../property/entities/unit.entity';
import { ManagementPackage } from './management-package/management-package.entity';

export enum SubscriptionStatus {
  ACTIVE = 'نشط',
  EXPIRED = 'منتهي',
  CANCELLED = 'ملغي',
  PENDING = 'معلق',
}

export enum SubscriptionType {
  YEARLY = 'سنوي',
  MONTHLY = 'شهري',
  CUSTOM = 'مخصص',
}

export enum PaymentMethod {
  CREDIT_CARD = 'بطاقة ائتمان',
  BANK_TRANSFER = 'تحويل بنكي',
  CASH = 'نقدي',
  MADA = 'مدى',
  APPLE_PAY = 'Apple Pay',
  STC_PAY = 'STC Pay',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  propertyId?: string;

  @Column({ nullable: true })
  unitId?: string;

  @Column({
    type: 'enum',
    enum: SubscriptionType,
    default: SubscriptionType.YEARLY,
  })
  subscriptionType: SubscriptionType;

  @Column({ nullable: true })
  customPeriodMonths?: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  paymentReference?: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ default: false })
  autoRenew: boolean;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ nullable: true })
  cancelledBy?: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Property, { nullable: true })
  @JoinColumn({ name: 'propertyId' })
  property?: Property;

  @ManyToOne(() => Unit, { nullable: true })
  @JoinColumn({ name: 'unitId' })
  unit?: Unit;

  @Column({ nullable: true })
  packageId?: string;

  @ManyToOne(() => ManagementPackage, { nullable: true })
  @JoinColumn({ name: 'packageId' })
  managementPackage?: ManagementPackage;
}
