import { Expose, Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class GetAllQuestionsQueryDto {
    @Expose()
    @IsOptional()
    @IsString()
    category?: string;

    @Expose()
    @IsOptional()
    @IsString()
    excludeCategory?: string;

    @Expose()
    @IsOptional()
    // Query params always arrive as strings ("true"/"false"). class-transformer's
    // @Type(() => Boolean) just calls Boolean(value), and Boolean("false") === true
    // (any non-empty string is truthy) - explicit string comparison avoids that trap.
    @Transform(({ value }) => (value === undefined ? undefined : value === 'true' || value === true))
    @IsBoolean()
    flagged?: boolean;

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
