import { Expose } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class CreateAnswerDTO {
    @Expose()
    @IsString()
    @IsNotEmpty()
    body: string;

    @Expose()
    @IsBoolean()
    is_correct: boolean;
}