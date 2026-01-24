import { Expose } from "class-transformer";

export class UserCreatedDTO {
    @Expose()
    id: string;

    @Expose()
    full_name: string;
}