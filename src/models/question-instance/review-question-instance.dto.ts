import { Expose } from "class-transformer";

export class ReviewQuestionInstanceDTO {
    @Expose()
    id: string;

    @Expose()
    selected_answers?: string[]

    @Expose()
    to_review: boolean;
}