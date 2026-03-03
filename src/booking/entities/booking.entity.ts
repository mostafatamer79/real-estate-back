import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/user-entity';
import { Offer } from '../../offer/offer-entity';
import { LegalDispute } from '../../legal-dispute/legal-dispute.entity';

export enum BookingStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PAID = 'paid',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum BookingType {
  VISIT = 'visit',
  PURCHASE = 'purchase',
  DISPUTE_RESOLUTION = 'dispute_resolution',
}

export enum VisitType {
  SELF = 'self',
  AGENT = 'agent',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: BookingType,
  })
  type: BookingType;

  @Column({
    type: 'enum',
    enum: VisitType,
    nullable: true,
  })
  visitType: VisitType;

  @Column({ type: 'json', nullable: true })
  services: any; // Can be array of strings or object

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'timestamp', nullable: true })
  bookingDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true }) // Agent or Service Provider
  @JoinColumn({ name: 'agentId' })
  agent: User;

  @Column({ nullable: true })
  agentId: string;

  @ManyToOne(() => Offer, { nullable: true })
  @JoinColumn({ name: 'offerId' })
  offer: Offer;

  @Column({ nullable: true })
  offerId: string;

  @ManyToOne(() => LegalDispute, { nullable: true })
  @JoinColumn({ name: 'disputeId' })
  dispute: LegalDispute;

  @Column({ nullable: true })
  disputeId: string;
}

