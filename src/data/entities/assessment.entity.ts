import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { type } from "os";
import { QuestionInstance } from "./question_instance.entity";
import { GetQuestionInstanceDTO } from "src/models/question-instance/get-question-instance.dto";
import { User } from "./user.entity";

@Entity('assessment')
export class Assessment {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column({ type: 'nvarchar', nullable: false, length: 10 })
    public exam_type: string;

    @Column({ type: 'integer', nullable: true })
    public grade: number;

    @Column({ type: 'datetime' })
    public time_started: Date;

    @Column({ type: 'datetime', nullable: true })
    public time_ended: Date;

    @Column({ type: 'nvarchar', length: 32, nullable: false, default: 'Draft' })
    public status: string;

    @Column({ type: 'tinyint', default: false })
    public submitted: boolean;

    @Column({ type: 'tinyint', default: false })
    public pass: boolean;

    @Column({ type: 'tinyint', nullable: false, default: false })
    public is_deleted: boolean;

    @OneToMany(type => QuestionInstance, questionInstance => questionInstance.assessment)
    public question_instances: Promise<GetQuestionInstanceDTO[]>;

    @ManyToOne(type => User, user => user.assessments)
    public user: Promise<User>;
}
