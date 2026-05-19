import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/user-entity';
import { Department } from '../../user/department.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderType: string; // 'buy' or 'rent'

  @Column()
  propertyType: string;

  @Column()
  city: string;

  @Column()
  neighborhood: string;

  @Column('decimal', { precision: 10, scale: 2 })
  area: number;

  @Column()
  propertyAge: string;

  @Column()
  deedType: string; // 'electronic' or 'paper'

  @Column('decimal', { precision: 14, scale: 2 })
  price: number;

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

  @Column({ default: false })
  hasMaidRoom: boolean;

  @Column({ default: false })
  hasRoof: boolean;

  @Column({ default: false })
  hasExternalAnnex: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  buildingArea: number;

  @Column({ default: false })
  hasGarage: boolean;

  @Column({ default: false })
  hasPool: boolean;

  @Column({ default: false })
  hasElevator: boolean;

  @Column({ nullable: true })
  furnitureStatus: string;

  @Column({ type: 'text', nullable: true })
  additionalDetails: string;

  @Column({ default: 'pending' })
  status: string; // pending, in_progress, completed, cancelled

  @Column({ nullable: true })
  clientName: string;

  @Column({ nullable: true })
  clientPhone: string;

  @Column({
    type: 'enum',
    enum: Department,
    nullable: true,
  })
  department?: Department | null;

  @ManyToOne(() => User, (user) => user.orders, { eager: true, onDelete: 'CASCADE', nullable: true })
  user: User | null;

  @Column({ nullable: true })
  assignedToId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
