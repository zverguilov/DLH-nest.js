import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'nvarchar', length: 64, unique: true })
  public name: string;

  @Column({ type: 'integer', nullable: false, default: 90 })
  public exam_length: number; // in minutes

  @Column({ type: 'integer', nullable: false, default: 60 })
  public number_of_questions: number;

  @Column({ type: 'integer', nullable: false, default: 75 })
  public passing_grade: number;
}
