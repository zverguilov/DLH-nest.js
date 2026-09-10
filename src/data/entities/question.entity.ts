import { Column, Entity, OneToMany, ManyToOne, PrimaryGeneratedColumn, Index, OneToOne } from "typeorm";
import { Exclude } from 'class-transformer';
import { Answer } from "./answer.entity";
import { QuestionInstance } from "./question_instance.entity";
import { Comment } from "./comment.entity";
import { Category } from "./category.entity";
import { QuestionStat } from "./question_stat.entity";


@Entity('question')
export class Question {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'nvarchar', length: 768 })
    public body: string;

    @Index()
    @Column({ type: 'nvarchar', nullable: false, length: 64})
    public category: string

    @Column({ type: 'tinyint', nullable: false, default: false })
    public is_flagged: boolean;

    @Column({ type: 'tinyint', nullable: false, default: false })
    public is_deleted: boolean;

    @OneToMany(type => Answer, answer => answer.question)
    public answers: Promise<Answer[]>

    @OneToMany(type => QuestionInstance, questionInstance => questionInstance.question)
    public instances: QuestionInstance[]

    @OneToMany(type => Comment, comment => comment.question)
    public comments: Comment[]

    @OneToOne(type => QuestionStat, questionStat => questionStat.question)
    public stat: Promise<QuestionStat>

    // @ManyToOne(type => Category, category => category.question)
    // public category: Promise<Category>
}
