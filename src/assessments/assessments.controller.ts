import { Controller, Get } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';

@Controller('api/v1/assessments')
export class AssessmentsController {
    public constructor(
        private readonly assessmentService: AssessmentsService
    ) {}

    @Get()
    public async getRandomAssessment(category: string) {
        return await this.assessmentService.getRandomAssessment(category);
    }
}
