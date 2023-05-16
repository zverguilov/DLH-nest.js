import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Exclude } from 'class-transformer';

@Entity('assessment')
export class Assessment {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column({ type: 'nvarchar', nullable: false, length: 10 })
    public number: string;

    @Column({ type: 'nvarchar', nullable: false, length: 10 })
    public examType: string;

    @Column({ type: 'integer', nullable: true })
    public grade: string;

    @Column({ type: 'datetime' })
    public timeStarted: Date;

    @Column({ type: 'datetime' })
    public timeEnded: Date;

    @Column({ type: 'nvarchar', length: 32 })
    public status: string;

    @Column({ type: 'tinyint', default: false })
    public submitted: boolean;

    @Column({ type: 'tinyint', default: false })
    public pass: boolean;
}
