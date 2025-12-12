// src/document/document.entity.ts
import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    BeforeInsert
  } from "typeorm";
  import { User } from "../user/user-entity";
  
  export enum DocumentType {
    COMMISSION_AGREEMENT = 'commission_agreement',
    PROPERTY_DEED = 'property_deed',
    CONTRACT = 'contract',
    IDENTITY_DOCUMENT = 'identity_document',
    LICENSE = 'license',
    INVOICE = 'invoice',
    REPORT = 'report',
    OTHER = 'other'
  }
  
  export enum DocumentStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EXPIRED = 'expired'
  }
  
  @Entity('documents')
  export class Document {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    title: string;
  
    @Column({ type: 'text', nullable: true })
    description: string;
  
    @Column({
      type: 'enum',
      enum: DocumentType
    })
    type: DocumentType;
  
    @Column()
    fileName: string;
  
    @Column()
    fileUrl: string;
  
    @Column()
    fileSize: number; // in bytes
  
    @Column()
    fileType: string; // e.g., 'application/pdf', 'image/jpeg'
  
    @Column({
      type: 'enum',
      enum: DocumentStatus,
      default: DocumentStatus.PENDING
    })
    status: DocumentStatus;
  
    @Column({ type: 'timestamp', nullable: true })
    expiresAt: Date;
  
    @Column({ default: false })
    requiresSignature: boolean;
  
    @Column({ type: 'timestamp', nullable: true })
    signedAt: Date;
  
    @Column({ nullable: true })
    signatureUrl: string;
  
    @Column({ type: 'json', nullable: true })
    tags: string[];
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'uploadedById' })
    uploadedBy: User;
  
    @Column()
    uploadedById: string;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'recipientId' })
    recipient: User;
  
    @Column()
    recipientId: string;
  
    @Column({ nullable: true })
    folder: string;
  
    @Column({ default: 0 })
    downloadCount: number;
  
    @Column({ default: 0 })
    viewCount: number;
  
    @Column({ default: true })
    isActive: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    @BeforeInsert()
    setDefaultExpiration() {
      if (!this.expiresAt && this.type === DocumentType.COMMISSION_AGREEMENT) {
        // Set commission agreements to expire in 30 days
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        this.expiresAt = expiryDate;
      }
    }
  }