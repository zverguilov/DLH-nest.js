import { Body, Controller, Get, Param, Post, Put, Query, UseFilters, UseGuards } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { Assessment } from 'src/data/entities/assessment.entity';
import { AuthGuard } from '@nestjs/passport';
import { CreateAssessmentDTO } from 'src/models/assessment/create-assessment.dto';
import { ErrorFilter } from 'src/middleware/filters/error.filter';

@Controller('api/v1')
export class AssessmentsController {
    public constructor(
        private readonly assessmentService: AssessmentsService
    ) {}

    @Get('assessment/ongoing/:userID')
    @UseGuards(AuthGuard())
    public async getActiveAssessment(@Param('userID') userID: string): Promise<Assessment> {
        return await this.assessmentService.getActiveAssessment(userID);
    }

    @Get('assessment/list/:userID')
    @UseGuards(AuthGuard())
    public async getMyAssessments(@Param('userID') userID: string): Promise<Assessment[]> {
        return await this.assessmentService.getMyAssessments(userID);
    }

    @Post('assessment')
    @UseGuards(AuthGuard())
    public async createRandomAssessment(@Body() payload: CreateAssessmentDTO): Promise<Assessment> {
        return await this.assessmentService.createRandomAssessment(payload);
    }

    @Put('assessment/submit/:assessmentID')
    @UseGuards(AuthGuard())
    public async submitAssessment(@Param('assessmentID') assessmentID: string): Promise<Assessment> {
        return await this.assessmentService.submitAssessment(assessmentID);
    }
}
