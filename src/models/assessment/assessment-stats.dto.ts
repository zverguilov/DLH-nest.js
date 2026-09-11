import { Expose } from 'class-transformer';

export class AssessmentStatsDTO {
    @Expose()
    public totalAttempts: number;

    @Expose()
    public avgScore: number;

    @Expose()
    public passRate: number;
}

export class AssessmentStatsOverviewDTO {
    @Expose()
    public assigned: AssessmentStatsDTO;

    @Expose()
    public training: AssessmentStatsDTO;
}
