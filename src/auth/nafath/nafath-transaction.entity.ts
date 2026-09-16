import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type NafathTransactionStatus = 'WAITING' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';

@Entity('nafath_transactions')
export class NafathTransaction {
  @PrimaryColumn({ type: 'uuid' })
  requestId: string;

  @Column()
  clientSecretHash: string;

  @Column()
  nationalId: string;

  @Column({ unique: true })
  transId: string;

  @Column()
  random: string;

  @Column({ default: 'WAITING' })
  status: NafathTransactionStatus;

  @Column({ nullable: true })
  userId?: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
