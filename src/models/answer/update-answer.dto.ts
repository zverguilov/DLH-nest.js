import { Expose } from "class-transformer";

export class UpdateAnswerDTO {
    @Expose()
    id: string;

    @Expose()
    body: string;

    @Expose()
    is_correct: boolean;

    @Expose()
    is_deleted: boolean;
}