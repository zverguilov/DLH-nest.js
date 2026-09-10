import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { QuestionInstance } from './question_instance.entity';
import { GetQuestionInstanceDTO } from 'src/models/question-instance/get-question-instance.dto';
import { User } from './user.entity';
import { Assessment } from './assessment.entity';
import { AssignAssessmentDTO } from 'src/models/assessment/assign-assessment.dto';

@Entity('assignment')
export class Assignment {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    public created_on: Date;

    @Column({ type: 'datetime', nullable: true })
    public deadline: Date;

    @Column({ type: 'nvarchar', nullable: false, length: 64 })
    public exam_type: string;

    @OneToMany(
        () => Assessment,
        (assessment) => assessment.assignment,
    )
    public assessments: Promise<Assessment[]>;

    @ManyToOne(() => User, (user) => user.assignments)
    public assigned_by: Promise<User>;
}
