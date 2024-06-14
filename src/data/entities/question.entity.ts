import { Column, Entity, OneToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Exclude } from 'class-transformer';
import { Answer } from "./answer.entity";
import { QuestionInstance } from "./question_instance.entity";
import { Comment } from "./comment.entity";
import { Category } from "./category.entity";


@Entity('question')
export class Question {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'nvarchar', length: 768, unique: true })
    public body: string;

    @Column({ type: 'nvarchar', nullable: false, length: 16})
    public category: string

    @Column({ type: 'tinyint', nullable: false, default: false })
    public is_flagged: boolean;

    @Column({ type: 'tinyint', nullable: false, default: false })
    public is_deleted: boolean;

    @OneToMany(type => Answer, answer => answer.question)
    public answers: Promise<Answer[]>

    @OneToMany(type => QuestionInstance, questionInstance => questionInstance.question)
    public instances: Promise<QuestionInstance[]>

    @OneToMany(type => Comment, comment => comment.question)
    public comments: Promise<Comment[]>

    // @ManyToOne(type => Category, category => category.question)
    // public category: Promise<Category>
}