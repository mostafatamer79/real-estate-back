// entities/legal-dispute.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../user/user-entity';



export enum LegalDisputeStatus {
  PENDING = 'معلقة',
  IN_PROGRESS = 'قيد المعالجة',
  COMPLETED = 'مكتملة',
  CANCELLED = 'ملغاة'
}
// shared/enums.ts
export enum PartyRole {
  SELLER = 'بائع',
  BUYER = 'مشتري',
  BROKER = 'وسيط'
}

export enum IdType {
  IDENTITY = 'هوية',
  RESIDENCE = 'إقامة',
  COMMERCIAL_REGISTER = 'سجل تجاري'
}

export enum PartyType {
  INDIVIDUAL = 'فرد',
  COMPANY = 'شركة'
}

export enum DisputeType {
  PROPERTY_DISPUTES = 'نزاعات الملكية',
  SALE_RENTAL_CONTRACTS = 'عقود البيع والإيجار',
  MORTGAGE_CASES = 'قضايا الرهن العقاري',
  BUILDING_VIOLATIONS = 'مخالفات البناء',
  EXPROPRIATION = 'نزع الملكية للمصلحة العامة',
  DEVELOPMENT_PROJECTS = 'مشاكل في مشاريع التطوير',
  INHERITANCE_DISPUTES = 'قضايا التركات العقارية',
  OTHER = 'اخرى'
}

export enum ContractType {
  SALE = 'عقد البيع',
  RENTAL = 'عقد الإيجار',
  USUFRUCT = 'عقد الانتفاع العقاري',
  GIFT = 'عقد الهبة العقاري',
  MORTGAGE = 'عقد الرهن العقاري',
  INVESTMENT = 'عقد الاستثمار العقاري',
  REVIEW = 'مراجعة العقود',
  OTHER = 'اخرى'
}

export enum ServiceStatus {
  PENDING = 'معلقة',
  IN_PROGRESS = 'قيد المعالجة',
  UNDER_REVIEW = 'قيد المراجعة',
  COMPLETED = 'مكتملة',
  CANCELLED = 'ملغاة'
}

export enum ApplicantRole {
  FIRST_PARTY = 'الطرف الاول',
  SECOND_PARTY = 'الطرف الثاني',
  AGENT = 'الوكيل'
}

export enum LegalServiceType {
  CONSULTATION = 'استشارات قانونية',
  REPORT = 'تقارير قانونية'
}
// legal-dispute.entity.ts
@Entity('legal_disputes')
export class LegalDispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'jsonb' })
  firstParty: {
    name: string;
    role: PartyRole;
    idType: IdType;
    idNumber: string;
    nationality: string;
    city: string;
    nationalAddress: string;
    phone: string;
    email: string;
  };

  @Column({ type: 'jsonb' })
  secondParty: {
    name: string;
    role: PartyRole;
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

  @Column({ type: 'jsonb', nullable: true })
  secondPartyAgent?: {
    name: string;
    agencyNumber: string;
    documentId?: string;
  };

  @Column({
    type: 'enum',
    enum: DisputeType
  })
  disputeType: DisputeType;

  @Column({ nullable: true })
  otherDisputeType?: string;

  @Column({ type: 'text' })
  disputeDescription: string;

  @Column('simple-array', { nullable: true })
  documentIds?: string[];

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.PENDING
  })
  status: ServiceStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  lawyerNotes?: string;

  @Column({ nullable: true })
  assignedTo?: string;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}