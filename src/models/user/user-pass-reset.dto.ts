import { Expose } from 'class-transformer';

export class UserPassResetDTO {
  @Expose()
  id: string;

  @Expose()
  password: string;
}
