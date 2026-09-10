import { Expose } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CategoryCreatedDTO {
  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsOptional()
  @IsInt()
  exam_length?: number;

  @Expose()
  @IsOptional()
  @IsInt()
  number_of_questions?: number;

  @Expose()
  @IsOptional()
  @IsInt()
  passing_grade?: number;
}
