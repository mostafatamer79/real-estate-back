import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Unit } from './unit.entity';
import { Property } from './property.entity';

@Entity('maintenance_requests')
export class MaintenanceRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Property, { nullable: true })
    @JoinColumn({ name: 'propertyId' })
    property: Property;

    @Column({ nullable: true })
    propertyId: string;

    @ManyToOne(() => Unit, { nullable: true })
    @JoinColumn({ name: 'unitId' })
    unit: Unit;

    @Column({ nullable: true })
    unitId: string;

    @Column({ type: 'enum', enum: ['routine', 'emergency'], default: 'routine' })
    type: 'routine' | 'emergency';

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'enum', enum: ['pending', 'in_progress', 'completed'], default: 'pending' })
    status: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    cost: number;

    @Column({ nullable: true })
    technicianName: string;

    @Column({ type: 'date', nullable: true })
    completedDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
