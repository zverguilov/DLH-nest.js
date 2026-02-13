import { Expose } from 'class-transformer';
import { Answer } from 'src/data/entities/answer.entity';

export class QuestionPreviewDTO {
    @Expose()
    id: string;

    @Expose()
    body: string;

    @Expose()
    answers: Promise<Answer[]>
}
