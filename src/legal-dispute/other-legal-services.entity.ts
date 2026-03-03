// other-legal-services.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../user/user-entity';

@Entity('other_legal_services')
export class OtherLegalService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  // Service Type
  @Column({
    type: 'enum',
    enum: ['استشارات قانونية', 'تقارير قانونية']
  })
  serviceType: string;

  // Common Fields
  @Column()
  name: string;

  @Column()
  phone: string;

  // For Consultations
  @Column({ type: 'text', nullable: true })
  consultationTopic?: string;

  // For Reports
  @Column({ nullable: true })
  userRole?: string;

  @Column({ nullable: true })
  propertyType?: string;

  @Column({ nullable: true })
  offerNumber?: string;

  @Column({ type: 'text', nullable: true })
  legalStatus?: string;

  // Document references
  @Column('simple-array', { nullable: true })
  documentIds: string[];

  @Column({
    type: 'enum',
    enum: ['معلقة', 'قيد المعالجة', 'مكتملة', 'ملغاة'],
    default: 'معلقة'
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  response: string;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  respondedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  consultationDetails?: string;

  @Column({ nullable: true })
  propertyLocation?: string;

  @Column({ type: 'text', nullable: true })
  reportDetails?: string;
}