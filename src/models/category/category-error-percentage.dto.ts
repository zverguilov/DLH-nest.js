import { Expose } from 'class-transformer';

export class CategoryErrorPercentageDTO {
  @Expose()
  name: string;

  @Expose()
  error_percentage: number;
}
