import { Expose, Type } from 'class-transformer';
import { ReportQuestionInstanceDTO } from './report-question-instance.dto';

export class AssessmentReportDTO {
    @Expose()
    public total: number;

    @Expose()
    @Type(() => ReportQuestionInstanceDTO)
    public questions: ReportQuestionInstanceDTO[];
}
