import { Expose } from "class-transformer";

export class UserActiveDTO {
    @Expose()
    id: string;

    @Expose()
    state: string;
}