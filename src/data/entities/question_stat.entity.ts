import { Column, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Question } from "./question.entity";

@Entity('question_stat')
export class QuestionStat {
    @PrimaryColumn('uuid')
    question_id: string;

    @OneToOne(() => Question, question => question.stat)
    @JoinColumn({ name: 'question_id' })
    question: Promise<Question>;

    @Column({ type: 'integer', nullable: true })
    public wrong_count: number;

    @Column({ type: 'integer', nullable: true })
    public total_count: number;

    @Index()
    @Column({ type: 'float', nullable: true })
    public bayesian: number;
}