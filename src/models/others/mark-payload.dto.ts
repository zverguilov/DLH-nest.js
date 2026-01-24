import { Expose } from "class-transformer";

export class MarkPayloadDTO {
    @Expose()
    public selected_answers?: string;

    @Expose()
    public question_id!: string;

    @Expose()
    public to_review?: boolean;
}