import { Expose } from "class-transformer";
import { UserCreatedDTO } from "../user/user-created.dto";

export class ReviewCommentDTO {
    @Expose()
    id: string;

    @Expose()
    content: string;

    @Expose()
    user: Promise<UserCreatedDTO>;
}