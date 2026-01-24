import { Expose } from "class-transformer";

export class UserRoleDTO {
    @Expose()
    id: string;

    @Expose()
    admin: boolean;
}