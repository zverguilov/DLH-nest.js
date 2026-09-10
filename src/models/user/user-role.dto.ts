import { Expose } from "class-transformer";
import { IsBoolean, IsUUID } from "class-validator";

export class UserRoleDTO {
    @Expose()
    @IsUUID()
    id: string;

    @Expose()
    @IsBoolean()
    admin: boolean;
}