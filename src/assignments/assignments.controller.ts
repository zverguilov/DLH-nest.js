import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { Assignment } from 'src/data/entities/assignment.entity';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/middleware/guards/role.guard';
import { StateGuard } from 'src/middleware/guards/state.guard';
import { GetAssignmentQueryDto } from 'src/models/assignment/get-assignments.dto';

@Controller('api/v1')
export class AssignmentsController {
    public constructor(
        private readonly assignmentService: AssignmentsService,
    ) { }

    @Get('assignments') //service endpoint, maintenance purposes through Postman only
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    public async getAssignments(@Query() query: GetAssignmentQueryDto): Promise<{ data: Assignment[]; nextCursor: string | null }> {
        const { category, assignedBy, limit, cursor } = query;

        return await this.assignmentService.getAssignments(category, assignedBy, limit, cursor);
    }
}
