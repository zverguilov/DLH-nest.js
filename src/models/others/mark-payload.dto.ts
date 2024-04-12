import { Expose } from "class-transformer";

export class MarkPayloadDTO {
    @Expose()
    public selectedAnswers!: [];

    @Expose()
    public questionID!: string;
}