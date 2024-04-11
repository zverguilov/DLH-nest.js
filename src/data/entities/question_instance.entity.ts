import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Exclude } from 'class-transformer';
import { Question } from "./question.entity";
import { Assessment } from "./assessment.entity";

@Entity('question_instance')
export class QuestionInstance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'nvarchar', nullable: false, length: 4096 })
    body: string;

    @ManyToOne(type => Question, question => question.instances)
    public question: Promise<Question>

    @ManyToOne(type => Assessment, assessment => assessment.question_instances)
    public assessment: Promise<Assessment>
}