import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuestionInstance } from './question_instance.entity';
import { GetQuestionInstanceDTO } from 'src/models/question-instance/get-question-instance.dto';
import { User } from './user.entity';
import { Assignment } from './assignment.entity';

@Entity('assessment')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'nvarchar', nullable: false, length: 64 })
  public exam_type: string;

  @Column({ type: 'integer', nullable: true })
  public grade: number;

  @Column({ type: 'datetime', nullable: true })
  public time_started: Date;

  @Column({ type: 'datetime', nullable: true })
  public time_ended: Date;

  @Column({ type: 'nvarchar', length: 32, nullable: false, default: 'Draft' })
  public status: string;

  @Column({ type: 'tinyint', default: false })
  public submitted: boolean;

  @Column({ type: 'tinyint', default: false })
  public pass: boolean;

  @Column({ type: 'tinyint', nullable: false, default: false })
  public is_deleted: boolean;

  @Column({ type: 'tinyint', nullable: false, default: false })
  public is_assigned: boolean;

  @Column({ type: 'integer', nullable: true, default: 0 })
  public attempts: number;

  @Column({ type: 'datetime', nullable: true })
  public deadline: Date;

  @OneToMany(
    () => QuestionInstance,
    (questionInstance) => questionInstance.assessment,
  )
  public question_instances: QuestionInstance[];

  @ManyToOne (
    () => Assignment,
    (assignment) => assignment.assessments
  )
  public assignment: Assignment;

  @ManyToOne(() => User, (user) => user.assessments)
  public user: User;
}
