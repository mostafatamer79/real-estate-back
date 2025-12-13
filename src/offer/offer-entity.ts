import { User } from 'src/user/user-entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne } from 'typeorm';

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Property Basic Information
  @Column()
  propertyType: string; // فيلا، قصر، شقة، إلخ

  @Column('decimal', { nullable: true })
  length: number;

  @Column('decimal', { nullable: true })
  width: number;

  @Column('decimal')
  area: number;

  @Column()
  propertyAge: string;

  @Column()
  direction: string;

  @Column('decimal')
  price: number;

  @Column()
  city: string;

  @Column()
  neighborhood: string;

  @Column('decimal', { nullable: true })
  streetWidth: number;

  @Column()
  deedType: string;

  @Column()
  propertyCondition: string;

  // Detailed Information (for certain property types)
  @Column('int', { nullable: true })
  rooms: number;

  @Column('int', { nullable: true })
  bathrooms: number;

  @Column('int', { nullable: true })
  livingRooms: number;

  @Column('int', { nullable: true })
  kitchens: number;

  @Column('int', { nullable: true })
  floors: number;

  @Column('int', { nullable: true })
  apartments: number;

  @Column({ nullable: true })
  hasMaidRoom: boolean;

  @Column({ nullable: true })
  hasRoof: boolean;

  @Column({ nullable: true })
  hasExternalAnnex: boolean;

  @Column('decimal', { nullable: true })
  buildingArea: number;

  @Column({ nullable: true })
  hasGarage: boolean;

  @Column({ nullable: true })
  hasPool: boolean;

  @Column({ nullable: true })
  hasElevator: boolean;

  @Column({ nullable: true })
  furnitureStatus: string; // مفروش، غير مفروش

  // Attachments
  @Column('text', { nullable: true })
  additionalNotes: string;

  @Column('simple-array', { nullable: true })
  propertyDocuments: string[]; // URLs to property documents

  @Column({ nullable: true })
  checkImage: string; // URL to check image

  @Column('simple-array', { nullable: true })
  mediaFiles: string[]; // URLs to images/videos

  @Column('simple-array', { nullable: true })
  threeDVideos: string[]; // URLs to 3D videos

  // Status and Metadata
  @Column({ default: 'draft' })
  status: string; // draft, published, sold, expired

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, { eager: true })
@JoinColumn({ name: 'userId' })
user: User;

@Column()
userId: string;
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}