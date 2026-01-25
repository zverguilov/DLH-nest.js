import { Expose } from 'class-transformer';

export class AssignAssessmentDTO {
  @Expose()
  public exam_type: string;

  @Expose()
  public user: string;

  @Expose()
  public attempts: number;
}
