import { Expose } from "class-transformer";
import { QuestionInstance } from "src/data/entities/question_instance.entity";

export class CreateAssessmentDTO {  
    @Expose()
    public exam_type: string;

    @Expose()
    public user: string;
}