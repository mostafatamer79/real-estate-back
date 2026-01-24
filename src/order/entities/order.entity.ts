import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../user/user-entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderType: string; // 'buy' or 'rent'

  @Column()
  propertyType: string;

  @Column()
  city: string;

  @Column()
  neighborhood: string;

  @Column('decimal', { precision: 10, scale: 2 })
  area: number;

  @Column()
  propertyAge: string;

  @Column()
  deedType: string; // 'electronic' or 'paper'

  @Column('decimal', { precision: 14, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true })
  additionalDetails: string;

  @ManyToOne(() => User, (user) => user.orders, { eager: true })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
