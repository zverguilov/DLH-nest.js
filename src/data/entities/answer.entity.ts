import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Question } from "./question.entity";

@Entity('answer')
export class Answer {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column({ type: 'nvarchar', nullable: false, length: 4096 })
    public body: string;

    @ManyToOne(type => Question, question => question.answers)
    public question: Question

    @Column({ type: 'tinyint', default: false })
    public is_correct: boolean;
}