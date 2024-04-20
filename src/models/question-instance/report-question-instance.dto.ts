import { Expose } from "class-transformer";

export class ReportQuestionInstanceDTO {
    @Expose()
    public id: string;

    @Expose()
    public assessment_index: number;

    @Expose()
    public correct_answers: number;

    @Expose()
    public is_correct: boolean;

    @Expose()
    public selected_answers?: string[];
}