// contract.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../user/user-entity';
import { ContractType, PartyType, IdType, ApplicantRole, ServiceStatus } from './legal-dispute.entity';

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: ContractType
  })
  contractType: ContractType;

  @Column({ nullable: true })
  otherContractType?: string;

  @Column({ type: 'jsonb' })
  firstParty: {
    name: string;
    type: PartyType;
    idType: IdType;
    idNumber: string;
    nationality: string;
    city: string;
    nationalAddress: string;
    phone: string;
    email: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  firstPartyAgent?: {
    name: string;
    agencyNumber: string;
    documentId?: string;
  };

  @Column({ type: 'jsonb' })
  secondParty: {
    name: string;
    type: PartyType;
    idType: IdType;
    idNumber: string;
    nationality: string;
    city: string;
    nationalAddress: string;
    phone: string;
    email: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  secondPartyAgent?: {
    name: string;
    agencyNumber: string;
    documentId?: string;
  };

  @Column({ type: 'text', nullable: true })
  servicesDescription?: string;

  @Column({ nullable: true })
  contractDuration?: string;

  @Column({ type: 'jsonb', nullable: true })
  paymentDetails?: {
    amount: string;
    method: string;
    dueDates: string;
  };

  @Column({ type: 'text', nullable: true })
  rightsResponsibilities?: string;

  @Column({ type: 'text', nullable: true })
  cancellationTerms?: string;

  @Column({
    type: 'enum',
    enum: ApplicantRole
  })
  applicantRole: ApplicantRole;

  @Column('simple-array', { nullable: true })
  contractDocumentIds?: string[];

  @Column('simple-array', { nullable: true })
  additionalDocumentIds?: string[];

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.PENDING
  })
  status: ServiceStatus;

  @Column({ type: 'text', nullable: true })
  reviewNotes?: string;

  @Column({ type: 'text', nullable: true })
  contractContent?: string;

  @Column({ nullable: true })
  contractNumber?: string;

  @Column({ type: 'timestamp', nullable: true })
  signedAt?: Date;

  @Column({ nullable: true })
  signedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}