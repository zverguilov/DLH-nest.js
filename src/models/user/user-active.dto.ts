import { Expose } from 'class-transformer';
import { IsBoolean, IsUUID } from 'class-validator';

export class UserActiveDTO {
  @Expose()
  @IsUUID()
  id: string;

  @Expose()
  @IsBoolean()
  state: boolean;
}
