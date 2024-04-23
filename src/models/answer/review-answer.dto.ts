import { Expose } from "class-transformer";

export class ReviewAnswerDTO {
    @Expose()
    id: string;

    @Expose()
    body: string;

    @Expose()
    is_correct: boolean;
}