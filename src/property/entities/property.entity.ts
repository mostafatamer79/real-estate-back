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

    // Offer-aligned fields
    @Column({ nullable: true })
    propertyType: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    length: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    width: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    area: number;

    @Column({ nullable: true })
    propertyAge: string;

    @Column({ nullable: true })
    direction: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    price: number;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    neighborhood: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    streetWidth: number;

    @Column({ nullable: true })
    deedType: string;

    @Column({ nullable: true })
    propertyCondition: string;

    @Column({ type: 'int', nullable: true })
    rooms: number;

    @Column({ type: 'int', nullable: true })
    bathrooms: number;

    @Column({ type: 'int', nullable: true })
    livingRooms: number;

    @Column({ type: 'int', nullable: true })
    kitchens: number;

    @Column({ type: 'int', nullable: true })
    floors: number;

    @Column({ type: 'int', nullable: true })
    apartments: number;

    @Column({ nullable: true })
    hasMaidRoom: boolean;

    @Column({ nullable: true })
    hasRoof: boolean;

    @Column({ nullable: true })
    hasExternalAnnex: boolean;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    buildingArea: number;

    @Column({ nullable: true })
    hasGarage: boolean;

    @Column({ nullable: true })
    hasPool: boolean;

    @Column({ nullable: true })
    hasElevator: boolean;

    @Column({ nullable: true })
    furnitureStatus: string;

    @Column({ type: 'text', nullable: true })
    additionalNotes: string;

    @Column({ type: 'simple-array', nullable: true })
    propertyDocuments: string[];

    @Column({ nullable: true })
    checkImage: string;

    @Column({ type: 'simple-array', nullable: true })
    mediaFiles: string[];

    @Column({ type: 'simple-array', nullable: true })
    threeDVideos: string[];

    @Column({ type: 'text', nullable: true })
    video3d: string;

    @Column({ nullable: true })
    dealType: string;

    @Column({ nullable: true })
    mainCategory: string;

    @Column({ default: 'draft' })
    status: string;

    @Column({ type: 'int', default: 0 })
    views: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    clientName: string;

    @Column({ nullable: true })
    clientPhone: string;

    @OneToMany(() => Unit, unit => unit.property, { cascade: true })
    units: Unit[];
    
    // Establishing a logical relationship with User (Owner)
    // Assuming the user creating/managing this is the owner or manager
    @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' }) 
    @JoinColumn({ name: 'ownerId' })
    owner: User;
    
    @Column({ nullable: true })
    ownerId: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
