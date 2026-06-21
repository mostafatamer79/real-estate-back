import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CustomerServiceFaqCategory } from './customer-service-faq-category.entity';

@Entity('customer_service_faqs')
export class CustomerServiceFaq {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  categoryAr: string;

  @Column({ type: 'varchar', length: 255 })
  categoryEn: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string | null;

  @ManyToOne(() => CustomerServiceFaqCategory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: CustomerServiceFaqCategory | null;

  @Column({ type: 'text' })
  questionAr: string;

  @Column({ type: 'text' })
  answerAr: string;

  @Column({ type: 'text' })
  questionEn: string;

  @Column({ type: 'text' })
  answerEn: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fontSize?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
