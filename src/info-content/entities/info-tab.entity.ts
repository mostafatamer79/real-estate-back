import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('info_tabs')
export class InfoTab {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  key: string; // terms | usage | permits | contact

  @Column({ type: 'varchar', length: 255 })
  titleAr: string;

  @Column({ type: 'varchar', length: 255 })
  titleEn: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

