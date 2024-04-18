import { Expose } from "class-transformer";
import { Question } from "src/data/entities/question.entity";

export class GetQuestionInstanceDTO {
    @Expose()
    public id: string;

    @Expose()
    public correct_answers: number;
}