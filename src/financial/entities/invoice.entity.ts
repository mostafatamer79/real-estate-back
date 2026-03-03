import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/user-entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  UNPAID = 'unpaid',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 14, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  serviceFee: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  tax: number;

  @Column('decimal', { precision: 14, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Polymorphic reference (e.g., PurchaseRequest, VisitRequest)
  @Column({ nullable: true })
  referenceType: string;

  @Column({ nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  documentUrl: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
