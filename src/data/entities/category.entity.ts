import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  public id: string;

  @Column({ type: 'nvarchar', length: 64, unique: true })
  @IsOptional()
  @IsString()
  public name: string;

  @Column({ type: 'integer', nullable: false, default: 90 })
  @IsOptional()
  @IsInt()
  public exam_length: number; // in minutes

  @Column({ type: 'integer', nullable: false, default: 60 })
  @IsOptional()
  @IsInt()
  public number_of_questions: number;

  @Column({ type: 'integer', nullable: false, default: 75 })
  @IsOptional()
  @IsInt()
  public passing_grade: number;
}
