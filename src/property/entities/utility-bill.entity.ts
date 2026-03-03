import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Unit } from './unit.entity';

export enum UtilityType {
    ELECTRICITY = 'electricity',
    WATER = 'water',
    GAS = 'gas',
    INTERNET = 'internet',
}

@Entity('utility_bills')
export class UtilityBill {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Unit)
    @JoinColumn({ name: 'unitId' })
    unit: Unit;

    @Column()
    unitId: string;

    @Column({
        type: 'enum',
        enum: UtilityType,
    })
    type: UtilityType;

    @Column()
    accountNumber: string; // Meter or Account ID

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'date' })
    billDate: Date;

    @Column({ default: false })
    isPaid: boolean;

    @Column({ type: 'enum', enum: ['owner', 'tenant'], default: 'tenant' })
    responsibility: 'owner' | 'tenant'; // Who pays?

    @CreateDateColumn()
    createdAt: Date;
}
