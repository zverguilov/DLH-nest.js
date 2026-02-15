import { Expose } from 'class-transformer';

export class GetCategoryDTO {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    exam_length: number;

    @Expose()
    number_of_questions: number;

    @Expose()
    passing_grade: number;

    @Expose()
    total_questions: number;
}
