import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TransactionType {
  SALE = 'sale',
  RENT = 'rent',
  COMMISSION = 'commission',
  TAX = 'tax',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  SETTLEMENT = 'settlement',
  EXPENSE = 'expense',
}

export enum PaymentMethod {
  BANK = 'bank',
  CARD = 'card',
  APPLE_PAY = 'apple_pay',
  WALLET = 'wallet',
  CASH = 'cash',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity()
export class FinancialTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column('decimal', { precision: 14, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  fromUserId: string; // Sender ID (User or Platform/System)

  @Column({ nullable: true })
  toUserId: string; // Receiver ID

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  taxAmount: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  commissionAmount: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  expenseCategory: string; // Marketing, Operational, etc. (relevant if type is EXPENSE)

  @Column({ type: 'jsonb', nullable: true })
  commissionBreakdown: any; // Store commission split (broker, platform, company)

  // Polymorphic reference (e.g., linked to an Order, Booking, etc.)
  @Column({ nullable: true })
  referenceType: string;

  @Column({ nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  transactionDate: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
