import { Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateCommentDTO {
    @Expose()
    @IsString()
    @IsNotEmpty()
    content: string;
}
