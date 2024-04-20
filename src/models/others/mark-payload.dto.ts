import { Expose } from "class-transformer";

export class MarkPayloadDTO {
    @Expose()
    public selected_answers?: [];

    @Expose()
    public questionID!: string;

    @Expose()
    public to_review?: boolean;
}