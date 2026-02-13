import { Expose } from "class-transformer";
import { Question } from "src/data/entities/question.entity";

export class CreateAnswerDTO {
    @Expose()
    body: string;

    @Expose()
    is_correct: boolean;

    @Expose()
    question: Promise<Question>;
}