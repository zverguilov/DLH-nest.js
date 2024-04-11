import { Controller, Get, Param, Query } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';

@Controller('api/v1/assessment')
export class AssessmentsController {
    public constructor(
        private readonly assessmentService: AssessmentsService
    ) {}

    @Get()
    public async getRandomAssessment(@Query('category') category: string) {
        return await this.assessmentService.getRandomAssessment(category);
    }
}
