import { Expose } from 'class-transformer';

export class UpdateQuestionDTO {
  @Expose()
  id: string;

  @Expose()
  body: string;

  @Expose()
  category: string;

  @Expose()
  is_flagged: boolean;

  @Expose()
  is_deleted: boolean;
}
