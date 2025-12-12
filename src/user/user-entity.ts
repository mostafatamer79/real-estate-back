import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  PrimaryGeneratedColumn, 
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  BeforeUpdate
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

// User Role Enum
export enum Role {
  ADMIN = 'admin',
  USER = 'user',
  AGENT = 'agent',
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

  @Column({ default: false })
  isVerified: boolean; // General verification status

  @Column({ default: false })
  isActive: boolean;

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
}