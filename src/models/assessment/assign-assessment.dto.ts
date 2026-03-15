import { Expose } from 'class-transformer';

export class AssignAssessmentDTO {
  @Expose()
  public exam_type: string;

  @Expose()
  public users: string[];

  @Expose()
  public attempts: number;

  @Expose()
  public deadline: Date;
}
