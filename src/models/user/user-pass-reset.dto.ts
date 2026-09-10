import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UserPassResetDTO {
  @Expose()
  @IsUUID()
  id: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  password: string;
}
