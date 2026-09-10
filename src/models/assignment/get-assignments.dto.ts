import { Expose } from "class-transformer";

export class GetAssignmentQueryDto {
    @Expose()
    category?: string;

    @Expose()
    assignedBy?: string;

    @Expose()
    limit?: number;

    @Expose()
    cursor?: string;
}
