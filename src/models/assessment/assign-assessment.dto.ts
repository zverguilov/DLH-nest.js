import { Expose } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsString, IsUUID } from 'class-validator';

export class AssignAssessmentDTO {
  @Expose()
  @IsString()
  public exam_type: string;

  @Expose()
  @IsArray()
  @IsUUID('4', { each: true })
  public users: string[];

  @Expose()
  @IsInt()
  public attempts: number;

  @Expose()
  @IsDateString()
  public deadline: string;
}
