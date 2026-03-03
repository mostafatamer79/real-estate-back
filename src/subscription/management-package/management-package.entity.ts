import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('management_packages')
export class ManagementPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  yearlyPrice: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  monthlyPrice: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  discount: number; // Percentage discount (0-100)

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', default: [] })
  features: string[]; // List of features (e.g., "Financial Management", "Legal Services")

  @Column({ type: 'json', default: [] })
  administrations: string[]; // List of administrations (e.g., "Real Estate", "Marketing")

  @Column({ type: 'json', default: [] })
  services: string[]; // List of services (e.g., "Maintenance", "Security")

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
