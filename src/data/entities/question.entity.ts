import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Exclude } from 'class-transformer';
import { Answer } from "./answer.entity";
import { type } from "os";
import { any } from "joi";
import { QuestionInstance } from "./question-instance.entity";


@Entity('question')
export class Question {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ type: 'nvarchar', nullable: false, length: 4096 })
    public body: string;

    @Column({ type: 'nvarchar', nullable: false, length: 16 })
    public category: string

    @OneToMany(type => Answer, answer => answer.question)
    public answers: Promise<Answer[]>

    @OneToMany(type => QuestionInstance, questionInstance => questionInstance.question)
    public instances: Promise<QuestionInstance[]>
}