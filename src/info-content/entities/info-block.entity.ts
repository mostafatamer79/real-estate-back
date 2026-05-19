import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { InfoTab } from './info-tab.entity';

@Entity('info_blocks')
export class InfoBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  tabId: string;

  @ManyToOne(() => InfoTab, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tabId' })
  tab: InfoTab;

  @Column({ type: 'varchar', length: 255 })
  labelAr: string;

  @Column({ type: 'varchar', length: 255 })
  labelEn: string;

  @Column({ type: 'text' })
  textAr: string;

  @Column({ type: 'text' })
  textEn: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

