import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/user-entity';
import { Offer } from '../offer-entity';

export enum VisitType {
  AGENT = 'agent',
  SELF = 'self',
}

export enum VisitStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('visit_requests')
export class VisitRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: VisitType,
  })
  visitType: VisitType;

  @Column({ type: 'json', nullable: true })
  selectedServices: string[]; // e.g., ['photography', 'video']

  @Column({ nullable: true })
  visitDate: Date;

  @Column({
    type: 'enum',
    enum: VisitStatus,
    default: VisitStatus.PENDING,
  })
  status: VisitStatus;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Offer, { nullable: false })
  @JoinColumn({ name: 'offerId' })
  offer: Offer;

  @Column()
  offerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
