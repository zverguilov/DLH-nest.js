import { Expose } from "class-transformer";

export class GetAnswerDTO {
    @Expose()
    public id: string;

    @Expose()
    public body: string;
}