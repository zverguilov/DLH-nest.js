import { Expose } from "class-transformer";

export class QuestionInstanceStatusDTO {
    @Expose()
    public is_correct: boolean;
}