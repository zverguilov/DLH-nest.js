import { Expose } from "class-transformer";

export class CategoryCreatedDTO {
    @Expose()
    id: string;

    @Expose()
    name: string;
}