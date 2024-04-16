import { Expose } from "class-transformer";

export class GetQuestionInstanceDTO {
    @Expose()
    public id: string;
}