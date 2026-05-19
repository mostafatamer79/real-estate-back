import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum CustomerServiceContactMethod {
  EMAIL = 'email',
  PHONE = 'phone',
}

export enum CustomerServiceFeedbackStatus {
  NEW = 'new',
  RESOLVED = 'resolved',
}

@Entity('customer_service_feedback')
export class CustomerServiceFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'enum', enum: CustomerServiceContactMethod })
  contactMethod: CustomerServiceContactMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phoneNumber?: string | null;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pagePath?: string | null;

  @Column({ type: 'enum', enum: CustomerServiceFeedbackStatus, default: CustomerServiceFeedbackStatus.NEW })
  status: CustomerServiceFeedbackStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

