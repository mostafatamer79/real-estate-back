import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Property } from './property.entity';

export enum UnitType {
    APARTMENT = 'apartment', // Apartment / شقة
    SHOP = 'shop', // Shop / محل
    OFFICE = 'office', // Office / مكتب
    SHOWROOM = 'showroom', // Showroom / معرض
}

export enum OccupancyStatus {
    VACANT = 'vacant', // Vacant / شاغرة
    RENTED = 'rented', // Rented / مؤجرة
    RESERVED = 'reserved', // Reserved / محجوزة
    MAINTENANCE = 'maintenance', // Under Maintenance / تحت الصيانة
}

@Entity('units')
export class Unit {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    unitNumber: string;

    @Column({
        type: 'enum',
        enum: UnitType,
    })
    type: UnitType;

    @Column({ type: 'float', nullable: true })
    area: number; // Square meters

    @Column({ type: 'int', nullable: true })
    roomsCount: number;

    @Column({ type: 'int', default: 0 })
    bathroomsCount: number;

    @Column({
        type: 'enum',
        enum: OccupancyStatus,
        default: OccupancyStatus.VACANT
    })
    occupancyStatus: OccupancyStatus;

    @Column({ type: 'date', nullable: true })
    expectedVacancyDate: Date;

    @ManyToOne(() => Property, property => property.units, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'propertyId' })
    property: Property;

    @Column()
    propertyId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany('Lease', 'unit', { cascade: true })
    leases: any[];
}
