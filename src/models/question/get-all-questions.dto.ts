import { Expose } from "class-transformer";

export class GetAllQuestionsQueryDto {
    @Expose()
    category?: string;

    @Expose()
    limit?: number;

    @Expose()
    cursorId?: string;

    @Expose()
    search?: string;
}
