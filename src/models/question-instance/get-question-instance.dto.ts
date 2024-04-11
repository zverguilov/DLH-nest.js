import { Expose } from "class-transformer";
import { GetAnswerDTO } from "../answer";

export class GetQuestionInstanceDTO {
    @Expose()
    public id: string;

    @Expose()
    public body: string;
}