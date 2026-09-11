import { Expose, Type } from "class-transformer";
import { IsInt, IsOptional, IsString } from "class-validator";

export class GetAllQuestionsQueryDto {
    @Expose()
    @IsOptional()
    @IsString()
    category?: string;

    @Expose()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit?: number;

    @Expose()
    @IsOptional()
    @IsString()
    cursorId?: string;

    @Expose()
    @IsOptional()
    @IsString()
    search?: string;
}
