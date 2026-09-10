import { Expose } from "class-transformer";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class FlagQuestionDTO {
    @Expose()
    @IsUUID()
    public question_id: string;

    @Expose()
    @IsUUID()
    public user_id: string;

    @Expose()
    @IsString()
    @IsNotEmpty()
    public content: string;
}