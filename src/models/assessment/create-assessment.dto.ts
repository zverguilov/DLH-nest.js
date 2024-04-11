import { Expose } from "class-transformer";
import { QuestionInstance } from "src/data/entities/question_instance.entity";

export class CreateAssessmentDTO {
    @Expose()
    public time_started: Date;
    
    @Expose()
    public exam_type: string;

    @Expose()
    public question_instances: QuestionInstance[];
}