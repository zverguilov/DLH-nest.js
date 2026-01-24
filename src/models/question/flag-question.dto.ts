import { Expose } from "class-transformer";

export class FlagQuestionDTO {
    @Expose()
    public question_id: string;
    
    @Expose()
    public user_id: string;

    @Expose()
    public content: string;
}