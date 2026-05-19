import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Lease } from './lease.entity';
import { User } from '../../user/user-entity';

@Entity('tenant_profiles')
export class TenantProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    fullName: string;

    @Column({ nullable: true })
    idNumber: string; // National ID or Iqama

    @Column({ nullable: true })
    idDocumentUrl: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    employer: string; // Jobplace / Entity

    @Column({ type: 'enum', enum: ['individual', 'company'], default: 'individual' })
    type: 'individual' | 'company';

    @Column({ type: 'int', nullable: true })
    preferredPaymentDay: number; // Day of the month (1-31)

    // Optional link to a system User account if they have one
    @OneToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ nullable: true })
    userId: string;

    @OneToMany(() => Lease, (lease) => lease.tenant)
    leases: Lease[];
    
    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
