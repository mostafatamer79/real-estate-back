// src/commission/commission.entity.ts
import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    BeforeInsert
  } from "typeorm";
  import { User } from "../user/user-entity";
  
  export enum CommissionStatus {
    DRAFT = 'draft',
    PENDING = 'pending',
    UNDER_REVIEW = 'under_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    PAID = 'paid',
    CANCELLED = 'cancelled'
  }
  
  export enum CommissionType {
    SALE = 'sale',
    RENT = 'rent',
    LEASE = 'lease',
    OTHER = 'other'
  }
  
  export enum PartyType {
    OWNER = 'owner',
    AGENT = 'agent',
    BROKER = 'broker',
    BUYER = 'buyer',
    SELLER = 'seller'
  }
  
  @Entity('commissions')
  export class Commission {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    commissionNumber: string;
  
    @Column({
      type: 'enum',
      enum: CommissionType,
      default: CommissionType.SALE
    })
    type: CommissionType;
  
    @Column({
      type: 'enum',
      enum: CommissionStatus,
      default: CommissionStatus.DRAFT
    })
    status: CommissionStatus;
  
    @Column({ type: 'text', nullable: true })
    notes: string;
  
    // Property Information
    @Column()
    propertyType: string;
  
    @Column()
    city: string;
  
    @Column()
    neighborhood: string;
  
    @Column()
    streetName: string;
  
    @Column()
    planNumber: string;
  
    @Column()
    plotNumber: string;
  
    @Column('decimal', { precision: 10, scale: 2 })
    area: number;
  
    @Column()
    deedNumber: string;
  
    @Column({ nullable: true })
    propertyAge: number;
  
    @Column({ nullable: true })
    numberOfFloors: number;
  
    @Column({ nullable: true })
    numberOfUnits: number;
  
    @Column({ type: 'text', nullable: true })
    specifications: string;
  
    // Contract Values
    @Column('decimal', { precision: 15, scale: 2 })
    totalAmount: number;
  
    @Column('decimal', { precision: 15, scale: 2 })
    taxAmount: number; // 15% tax
  
    @Column('decimal', { precision: 15, scale: 2 })
    amountAfterTax: number;
  
    @Column('decimal', { precision: 5, scale: 2 })
    commissionPercentage: number;
  
    @Column('decimal', { precision: 15, scale: 2 })
    commissionAmount: number;
  
    @Column('decimal', { precision: 15, scale: 2, nullable: true })
    finalCommissionAmount: number;
  
    // Parties Information
    @ManyToOne(() => User)
    @JoinColumn({ name: 'creatorId' })
    creator: User;
  
    @Column()
    creatorId: string;
  
    @Column({ type: 'json' })
    owner: {
      name: string;
      idNumber: string;
      partyType: PartyType;
      agencyNumber?: string;
      propertyType?: string;
      agreedPercentage?: number;
    };
  
    @Column({ type: 'json' })
    buyer: {
      name: string;
      idNumber: string;
      partyType: PartyType;
      agencyNumber?: string;
      agreedPercentage?: number;
    };
  
    // Brokers Information
    @Column({ type: 'json', nullable: true })
    brokers: Array<{
      name: string;
      license: string;
      percentage: number;
      mobile: string;
      email: string;
      commissionAmount: number;
    }>;
  
    @Column({ type: 'json', nullable: true })
    brokerPercentages: Array<{
      name: string;
      percentage: number;
      amountAfterTax: number;
    }>;
  
    // Documents
    @Column({ type: 'json', nullable: true })
    attachments: string[]; // File URLs
  
    @Column({ type: 'timestamp', nullable: true })
    submittedAt: Date;
  
    @Column({ type: 'timestamp', nullable: true })
    reviewedAt: Date;
  
    @Column({ type: 'timestamp', nullable: true })
    approvedAt: Date;
  
    @Column({ type: 'timestamp', nullable: true })
    paidAt: Date;
  
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'reviewedById' })
    reviewedBy: User;
  
    @Column({ nullable: true })
    reviewedById: string;
  
    @Column({ nullable: true })
    rejectionReason: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    @BeforeInsert()
    generateCommissionNumber() {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      this.commissionNumber = `COM-${timestamp}-${random}`;
    }
  
    @BeforeInsert()
    calculateValues() {
      // Calculate tax (15%)
      this.taxAmount = this.totalAmount * 0.15;
      this.amountAfterTax = this.totalAmount - this.taxAmount;
      
      // Calculate commission amount
      this.commissionAmount = this.amountAfterTax * (this.commissionPercentage / 100);
      
      // Default final commission amount
      this.finalCommissionAmount = this.commissionAmount;
    }
  }