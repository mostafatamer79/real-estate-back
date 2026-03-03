import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MarketingRequest } from './marketing-request.entity';

@Entity()
export class MarketingCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MarketingRequest)
  request: MarketingRequest;

  @Column()
  platform: string; // 'facebook', 'instagram', 'tiktok', 'snapchat'

  @Column({ nullable: true })
  externalId: string; // ID from the social platform

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  engagement: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  @Column({ type: 'jsonb', nullable: true })
  analyticsData: Record<string, any>;

  @Column({ nullable: true })
  publishedUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
