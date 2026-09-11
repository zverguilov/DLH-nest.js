import { Column, Entity, Index, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsEmail } from 'class-validator';
import { Comment } from './comment.entity';
import { Assessment } from './assessment.entity';
import { Assignment } from './assignment.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Index()
  @Column({ type: 'nvarchar', nullable: false, length: 128 })
  public full_name!: string;

  @IsEmail()
  @Column({ type: 'varchar', nullable: false, unique: true, length: 256 })
  public email: string;

  @Column({ type: 'nvarchar', nullable: false, length: 512, select: false })
  password: string;

  @Column({ type: 'varchar', nullable: false, default: 'User' })
  public role: string;

  @Column({ type: 'varchar', nullable: false, default: 'Locked' })
  public state: string;

  @Column({ type: 'tinyint', nullable: false, default: false })
  public is_deleted: boolean;

  @OneToMany(() => Comment, (comment) => comment.user)
  public comments: Promise<Comment[]>;

  @OneToMany(() => Assessment, (assessment) => assessment.user)
  public assessments: Promise<Assessment[]>;

  @OneToMany(
    () => Assignment,
    (assignment) => assignment.assigned_by
  )
  public assignments: Promise<Assignment>;
}
