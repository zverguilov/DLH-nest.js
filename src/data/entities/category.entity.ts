import { Column, Entity, ManyToOne, OneToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Question } from "./question.entity";
import { number } from "joi";

@Entity('category')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'nvarchar', length: 64 })
    public name: string;

    @Column({ type: 'integer', nullable: false, default: 90 })
    public exam_length: number; // in minutes

    @Column({ type: 'integer', nullable: false, default: 60 })
    public number_of_questions: number;

    @OneToMany(type => Question, question => question.category)
    public question: Question
}