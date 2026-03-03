import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/user-entity';

export enum PhotographerType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

@Entity()
export class PhotographerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({
    type: 'enum',
    enum: PhotographerType,
    default: PhotographerType.INDIVIDUAL,
  })
  type: PhotographerType;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  completedJobs: number;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'jsonb', nullable: true })
  equipment: string[];

  @Column({ type: 'jsonb', nullable: true })
  portfolioUrls: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
