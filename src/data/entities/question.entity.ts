import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Exclude } from 'class-transformer';
import { Answer } from "./answer.entity";
import { QuestionInstance } from "./question_instance.entity";
import { Comment } from "./comment.entity";


@Entity('question')
export class Question {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'nvarchar', length: 4096 })
    public body: string;

    @Column({ type: 'nvarchar', nullable: false, length: 16 })
    public category: string

    @OneToMany(type => Answer, answer => answer.question)
    public answers: Promise<Answer[]>

    @OneToMany(type => QuestionInstance, questionInstance => questionInstance.question)
    public instances: Promise<QuestionInstance[]>

    @OneToMany(type => Comment, comment => comment.question)
    public comments: Promise<Comment[]>
}