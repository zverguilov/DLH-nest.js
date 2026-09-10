import { Expose } from 'class-transformer';
import { User } from 'src/data/entities/user.entity';

export class CreateAssignmentDTO {
  @Expose()
  public exam_type: string;

  @Expose()
  public assigned_by: User;

  @Expose()
  public deadline: string;
}
