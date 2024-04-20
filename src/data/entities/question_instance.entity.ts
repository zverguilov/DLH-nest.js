import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Question } from "./question.entity";
import { Assessment } from "./assessment.entity";

@Entity('question_instance')
export class QuestionInstance {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column({ type: 'integer', nullable: true })
    public assessment_index: number;

    @Column({ type: 'tinyint', nullable: false, default: false })
    public is_correct: boolean;

    @Column({ type: 'nvarchar', nullable: true, length: 1024 })
    public selected_answers?: string[];

    @Column({ type: "integer", nullable: false, default: 1 })
    public correct_answers: number;

    @Column({ type: 'tinyint', nullable: false, default: false })
    public to_review: boolean;

    @ManyToOne(type => Question, question => question.instances)
    public question: Promise<Question>

    @ManyToOne(type => Assessment, assessment => assessment.question_instances)
    public assessment: Promise<Assessment>
}