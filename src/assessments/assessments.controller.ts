import { Controller, Get, Param, Query } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { Assessment } from 'src/data/entities/assessment.entity';

@Controller('api/v1/assessment')
export class AssessmentsController {
    public constructor(
        private readonly assessmentService: AssessmentsService
    ) {}

    @Get()
    public async getRandomAssessment(@Query('category') category: string): Promise<Assessment> {
        return await this.assessmentService.getRandomAssessment(category);
    }
}
