import { Expose, Type } from "class-transformer";
import { IsInt, IsOptional, IsString } from "class-validator";

export class GetAssignmentQueryDto {
    @Expose()
    @IsOptional()
    @IsString()
    category?: string;

    @Expose()
    @IsOptional()
    @IsString()
    assignedBy?: string;

    @Expose()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit?: number;

    @Expose()
    @IsOptional()
    @IsString()
    cursor?: string;
}
