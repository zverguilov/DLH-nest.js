import { Expose } from "class-transformer";

export class CreateQuestionInstanceDTO {
    @Expose()
    public body: string;
    
    @Expose()
    public question: string;

    @Expose()
    public assessment: string;
}