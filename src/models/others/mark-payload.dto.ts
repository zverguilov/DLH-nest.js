import { Expose } from "class-transformer";
import { IsBoolean, IsOptional, IsString, IsUUID } from "class-validator";

export class MarkPayloadDTO {
    @Expose()
    @IsOptional()
    @IsString()
    public selected_answers?: string;

    @Expose()
    @IsUUID()
    public question_id!: string;

    @Expose()
    @IsOptional()
    @IsBoolean()
    public to_review?: boolean;
}