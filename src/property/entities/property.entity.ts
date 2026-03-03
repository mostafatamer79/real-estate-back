import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Unit } from './unit.entity';
import { User } from '../../user/user-entity';

export enum PropertyType {
    BUILDING = 'building', // Omni / عمارة
    COMPOUND = 'compound', // Compound / مجمع
    LAND = 'land', // Land / أرض
    WAREHOUSE = 'warehouse', // Warehouse / مستودع
}

@Entity('properties')
export class Property {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    deedNumber: string;

    @Column({
        type: 'enum',
        enum: PropertyType,
    })
    type: PropertyType;

    @Column({ nullable: true })
    locationUrl: string; // Google Maps URL

    @Column({ type: 'simple-json', nullable: true })
    coordinates: { lat: number; lng: number };

    @Column({  nullable: true })
    constructionDate: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    purchasePrice: number; // For ROI calculation

    @OneToMany(() => Unit, unit => unit.property, { cascade: true })
    units: Unit[];
    
    // Establishing a logical relationship with User (Owner)
    // Assuming the user creating/managing this is the owner or manager
    @ManyToOne(() => User, { nullable: true }) 
    @JoinColumn({ name: 'ownerId' })
    owner: User;
    
    @Column({ nullable: true })
    ownerId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
