import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Lease } from './lease.entity';

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    OVERDUE = 'overdue',
}

export enum PaymentMethod {
    BANK_TRANSFER = 'bank_transfer',
    ONLINE_PAYMENT = 'online_payment',
    CASH = 'cash',
}

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Lease)
    @JoinColumn({ name: 'leaseId' })
    lease: Lease;

    @Column()
    leaseId: string;

    @Column({ type: 'date' })
    dueDate: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    status: PaymentStatus;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
        nullable: true
    })
    method: PaymentMethod;

    @Column({ type: 'date', nullable: true })
    paidDate: Date;

    @Column({ nullable: true })
    transactionReference: string;

    @CreateDateColumn()
    createdAt: Date;
}
