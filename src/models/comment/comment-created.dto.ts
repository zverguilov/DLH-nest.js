import { Expose } from "class-transformer";

export class CommentCreatedDTO {
    @Expose()
    id: string;

    @Expose()
    content: string;
}