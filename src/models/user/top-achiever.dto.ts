import { Expose } from 'class-transformer';

export class TopAchieverDTO {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  adjusted_score: number;
}
