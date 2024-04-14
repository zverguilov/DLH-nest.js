import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Question } from "./question.entity";
import { User } from "./user.entity";
import { type } from "os";

@Entity('comment')
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    public id: string;
    
    @Column({ type: 'nvarchar', nullable: false, length: 4096 })
    public content: string;
    
    @ManyToOne(type => User, user => user.comments)
    public user: Promise<User>;
    
    @ManyToOne(type  => Question, question => question.comments)
    public question: Promise<Question>;
}