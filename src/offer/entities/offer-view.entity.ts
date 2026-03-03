import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Offer } from '../offer-entity';

@Entity('offer_views')
export class OfferView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  offerId: string;

  @Column()
  ip: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Offer)
  @JoinColumn({ name: 'offerId' })
  offer: Offer;
}
