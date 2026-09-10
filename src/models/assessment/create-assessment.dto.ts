import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAssessmentDTO {
  @Expose()
  @IsString()
  public exam_type: string;

  @Expose()
  @IsUUID()
  public user: string;

  @Expose()
  @IsOptional()
  @IsBoolean()
  public is_assigned?: boolean;
}
