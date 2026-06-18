
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    key: string;

    @Column()
    value: string; // Store as string, parse as needed

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    category: string;

    @Column({ nullable: true })
    subcategory: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
