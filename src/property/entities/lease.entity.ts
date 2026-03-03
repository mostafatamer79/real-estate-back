import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Unit } from './unit.entity';
import { TenantProfile } from './tenant-profile.entity';

@Entity('leases')
export class Lease {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Unit)
    @JoinColumn({ name: 'unitId' })
    unit: Unit;

    @Column()
    unitId: string;

    @ManyToOne(() => TenantProfile)
    @JoinColumn({ name: 'tenantId' })
    tenant: TenantProfile;

    @Column()
    tenantId: string;

    @Column({ type: 'date' })
    startDate: Date;

    @Column({ type: 'date' })
    endDate: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    annualRent: number;

    @Column({ type: 'enum', enum: ['monthly', 'quarterly', 'semi-annual', 'annual'], default: 'annual' })
    paymentFrequency: string;

    // Security Deposit
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    securityDeposit: number;

    @Column({ type: 'enum', enum: ['held', 'partially_refunded', 'fully_refunded'], default: 'held' })
    securityDepositStatus: string;

    @Column({ type: 'text', nullable: true })
    deductionReason: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
