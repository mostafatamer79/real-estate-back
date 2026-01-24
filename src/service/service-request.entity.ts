// src/service-request/service-request.entity.ts
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

  export enum ServiceCategory {
    POST_PURCHASE = 'postPurchase',
    LEGAL = 'legal',
    CONSTRUCTION = 'construction',
    OTHER = 'other'
  }

  export enum ServiceStatus {
    PENDING = 'pending',
    ASSIGNED = 'assigned',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
  }
  export enum PaidStatus {
   PAID = 'paid',
   UNPAID = 'unpaid'
  }
  @Entity('service_requests')
  export class ServiceRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
      type: 'enum',
      enum: ServiceCategory
    })
    category: ServiceCategory;

    @Column()
    serviceType: string; // Specific service like "الغاز", "نقل وتركيب الأثاث"

    @Column()
    clientName: string;

    @Column()
    phone: string;

    @Column()
    city: string;

    @Column()
    district: string;

    @Column({ type: 'integer' })
    quantity: number;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
      type: 'enum',
      enum: ServiceStatus,
      default: ServiceStatus.PENDING
    })
    status: ServiceStatus;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    estimatedCost: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    finalCost: number;

    @Column({ nullable: true })
    assignedAgentId: string;

    @Column({ type: 'timestamp', nullable: true })
    assignedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date;

    @Column({ type: 'boolean', default: false })
    invoiceGenerated: boolean;

    @Column({ nullable: true })
    invoiceNumber: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ nullable: true })
    userId: string | null;
   @Column({nullable:false,default:100})
    price:number

    @Column({type:'enum',enum:PaidStatus,default:PaidStatus.UNPAID})
    paymentStatus:PaidStatus
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @BeforeInsert()
    generateInvoiceNumber() {
      if (!this.invoiceNumber) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        this.invoiceNumber = `INV-${timestamp}-${random}`;
      }
    }
  }