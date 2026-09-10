import { Expose } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateAnswerDTO {
    @Expose()
    @IsUUID()
    id: string;

    @Expose()
    @IsString()
    @IsNotEmpty()
    body: string;

    @Expose()
    @IsBoolean()
    is_correct: boolean;

    @Expose()
    @IsOptional()
    @IsBoolean()
    is_deleted?: boolean;
}