import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { IsEmail } from 'class-validator';
import { Comment } from "./comment.entity";
import { Assessment } from "./assessment.entity";

@Entity('user')
export class User {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column({ type: 'nvarchar', nullable: false, length: 128 })
    public full_name!: string;

    @IsEmail()
    @Column({ type: 'varchar', nullable: false, unique: true, length: 256 })
    public email: string;

    @Column({ type: 'nvarchar', nullable: false, length: 512 })
    password: string;

    @Column({ type: 'varchar', nullable: false, default: 'User' })
    public role: string;

    @Column({ type: 'varchar', nullable: false, default: 'Locked' })
    public state: string;

    @Column({ type: 'tinyint', nullable: false, default: false })
    public is_deleted: boolean;

    @OneToMany(type => Comment, comment => comment.user)
    public comments: Promise<Comment[]>;

    @OneToMany(type => Assessment, assessment => assessment.user)
    public assessments: Promise<Assessment[]>;
}