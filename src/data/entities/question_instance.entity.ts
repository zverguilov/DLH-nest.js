import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Question } from "./question.entity";
import { Assessment } from "./assessment.entity";

@Entity('question_instance')
export class QuestionInstance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'tinyint', nullable: false, default: false })
    is_correct: boolean;

    @Column({ type: 'nvarchar', nullable: true, length: 1024 })
    selected_asnwers: string;

    @Column({ type: "integer", nullable: false, default: 1 })
    correct_answers: number;

    @ManyToOne(type => Question, question => question.instances)
    public question: Promise<Question>

    @ManyToOne(type => Assessment, assessment => assessment.question_instances)
    public assessment: Promise<Assessment>
}