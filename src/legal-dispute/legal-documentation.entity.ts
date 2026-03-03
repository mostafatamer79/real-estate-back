// legal-documentation.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../user/user-entity';

@Entity('legal_documentations')
export class LegalDocumentation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  // First Party
  @Column({ type: 'jsonb' })
  firstParty: {
    name: string;
    idNumber: string;
    idType: 'هوية' | 'إقامة' | 'سجل تجاري';
    identityDocumentId?: string;
  };

  // Second Party
  @Column({ type: 'jsonb' })
  secondParty: {
    name: string;
    idNumber: string;
    idType: 'هوية' | 'إقامة' | 'سجل تجاري';
    identityDocumentId?: string;
  };

  // Required Documents
  @Column({ nullable: true })
  ownershipDeedDocumentId?: string;

  @Column({ type: 'text', nullable: true })
  ownershipDeedDescription?: string;

  @Column({ nullable: true })
  saleAmount?: number;

  @Column({ nullable: true })
  saleAmountProofDocumentId?: string;

  // Other documents
  @Column('simple-array', { nullable: true })
  otherDocumentIds: string[];

  @Column({ type: 'text', nullable: true })
  otherDocumentsDescription: string;

  @Column({
    type: 'enum',
    enum: ['معلقة', 'قيد التوثيق', 'مكتملة', 'ملغاة'],
    default: 'معلقة'
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  certificationNumber: string;

  @Column({ type: 'timestamp', nullable: true })
  certifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text', nullable: true })
  ownershipDeedNotes?: string;

  @Column({ type: 'text', nullable: true })
  otherDocumentsNotes?: string;

  @Column({ type: 'text', nullable: true })
  additionalRequirements?: string;
}
