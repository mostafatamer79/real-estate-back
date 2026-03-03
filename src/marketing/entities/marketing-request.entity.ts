import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MarketingRequestType {
  PHOTOGRAPHY_PROFESSIONAL = 'photography_professional',
  PHOTOGRAPHY_FIELD = 'photography_field',
  AD_CAMPAIGN = 'ad_campaign',
  SOCIAL_MEDIA = 'social_media',
}

export enum MarketingRequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity()
export class MarketingRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MarketingRequestType,
  })
  type: MarketingRequestType;

  @Column({
    type: 'enum',
    enum: MarketingRequestStatus,
    default: MarketingRequestStatus.PENDING,
  })
  status: MarketingRequestStatus;

  @Column()
  clientId: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @Column({ nullable: true })
  assignedTo: string; // ID of the agent/photographer assigned

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  engagement: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
