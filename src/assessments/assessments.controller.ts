import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { Assessment } from 'src/data/entities/assessment.entity';
import { AuthGuard } from '@nestjs/passport';
import { CreateAssessmentDTO } from 'src/models/assessment/create-assessment.dto';

@Controller('api/v1/assessment')
export class AssessmentsController {
    public constructor(
        private readonly assessmentService: AssessmentsService
    ) {}

    @Post()
    @UseGuards(AuthGuard())
    public async createRandomAssessment(@Body() payload: CreateAssessmentDTO): Promise<Assessment> {
        return await this.assessmentService.createRandomAssessment(payload);
    }
}
