import { Expose } from 'class-transformer';

export class CreateAssessmentDTO {
  @Expose()
  public exam_type: string;

  @Expose()
  public user: string;

  @Expose()
  public is_assigned?: boolean;
}
