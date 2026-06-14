import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/user-entity';
import { Offer } from '../offer-entity';

export enum OfferReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('offer_reports')
export class OfferReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reason: string;

  @Column('text', { nullable: true })
  message: string | null;

  @Column({
    type: 'enum',
    enum: OfferReportStatus,
    default: OfferReportStatus.PENDING,
  })
  status: OfferReportStatus;

  @Column('text', { nullable: true })
  adminNote: string | null;

  @ManyToOne(() => Offer, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'offerId' })
  offer: Offer;

  @Column()
  offerId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'reporterId' })
  reporter: User | null;

  @Column({ nullable: true })
  reporterId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'handledById' })
  handledBy: User | null;

  @Column({ nullable: true })
  handledById: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
