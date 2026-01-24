import { Expose } from 'class-transformer';

export class ReviewFlaggedQuestionDTO {
  @Expose()
  public id: string;

  @Expose()
  public body: string;

  @Expose()
  public category: string;

  @Expose()
  public is_flagged: boolean;
}
