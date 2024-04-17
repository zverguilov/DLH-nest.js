import { Expose } from "class-transformer";

export class UserGetDTO {
    @Expose()
    id: string;

    @Expose()
    full_name: string;

    @Expose()
    email: string;

    @Expose()
    role: string;
}