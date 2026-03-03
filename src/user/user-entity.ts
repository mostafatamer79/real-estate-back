import { Order } from "../order/entities/order.entity";
import { Booking } from "../booking/entities/booking.entity";
import {  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  OneToOne
} from "typeorm";

// Permission Entity
@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // e.g., 'task.create', 'user.delete', 'report.view'

  @Column({ nullable: true })
  description: string;



  @ManyToMany(() => User, user => user.permissions)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}

export enum Role {
  ADMIN = 'admin',
  USER = 'user', // Beneficiary / المستفيد
  BROKER = 'broker', // Real Estate Broker / وسيط عقاري
  REAL_ESTATE_OFFICE = 'real_estate_office', // مكتب عقاري
  OWNER = 'owner', // Malek / مالك
  LAWYER = 'lawyer', // Mahamy / محام
  ENGINEERING_OFFICE = 'engineering_office', // Engineering Office / مكتب هندسي
  OTHER = 'other', // Other / أخرى
  AGENT = 'agent', // Keep for backward compatibility if needed, though BROKER is preferred
  EMPLOYEE = 'employee', // Employee / موظف
  COLLABORATOR = 'collaborator', // Collaborator / متعاون
  MARKETING = 'marketing',
  MARKETING_ADMIN = 'marketing_admin',
  LEGAL = 'legal',
  LEGAL_ADMIN = 'legal_admin',
  FINANCE = 'finance',
  FINANCE_ADMIN = 'finance_admin',
  VIEWER = 'viewer',
}

export enum ApplyStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

export enum FinancialAgreementType {
    SALARY = 'salary',
    PERCENTAGE = 'percentage'
}

export enum VerifyStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

// User Entity
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({nullable:true})
  firstName: string;

  @Column({nullable:true})
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  otp: string | null;

  @Column({ type: 'timestamp', nullable: true })
expireOtp: Date | null;

  @Column({ unique: true, nullable: true })
  phone?: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ nullable: true })
  roleOtherDescription?: string; // For Role.OTHER

  @Column({ default: false })
  isVerified: boolean; // General verification status

  @Column({ default: false })
  isActive: boolean;

  @Column({ nullable: true })
  falLicenseNumber?: string; // Formerly agentLicenseNumber

  @Column({ nullable: true })
  falLicenseExpiry?: Date;

  @Column({ nullable: true })
  lawLicenseNumber?: string; // For Lawyer

  @Column({ nullable: true })
  commercialRegistrationNumber?: string; // For Engineering Office

  // Legacy field, keeping for safety or migration
  @Column({ nullable: true })
  agentLicenseNumber?: string;

  @Column({
    nullable: true,
    type: 'enum',
    enum: VerifyStatus,
    default: VerifyStatus.PENDING,
  })
  agentVerificationStatus: VerifyStatus; // Agent-specific verification

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  profileImage?: string;

  @Column({ nullable: true })
  idDocument?: string; // For verification documents

  @Column({ nullable: true })
  licenseDocument?: string; // For agent license documents
    
  @Column({
      type: 'enum',
      enum: FinancialAgreementType,
      nullable: true
  })
  financialAgreementType: FinancialAgreementType;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  financialAgreementValue: number;


  @Column({ nullable: true })
 legalDisputes?:string


  @Column({ nullable: true })
  contracts?: string;

  // National Access / Verification
  @Column({ unique: true, nullable: true })
  nationalId?: string;

  // National Address
  @Column({ nullable: true })
  postalCode?: string;

  @Column({ nullable: true })
  streetName?: string;

  @Column({ nullable: true })
  district?: string;

  @Column({ nullable: true })
  additionalNumber?: string;

  @Column({ nullable: true })
  unitNumber?: string;

  // Broker Details
  @Column({ nullable: true })
  licenseIssueDate?: Date;

  @Column({
    type: 'enum',
    enum: ['individual', 'office'],
    nullable: true
  })
  brokerType?: 'individual' | 'office';

  @ManyToMany(() => Permission, permission => permission.users, { cascade: true })
  @JoinTable({
    name: 'user_permissions',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id'
    }
  })
  permissions: Permission[];


  @Column({ type: 'simple-json', nullable: true })
  departmentPermissions: any;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];
}