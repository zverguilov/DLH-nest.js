import { Controller } from '@nestjs/common';
import { QuestionInstancesService } from './question-instances.service';

@Controller('api/v1/question-instances')
export class QuestionInstancesController {
    public constructor(
        private readonly questionInstanceService: QuestionInstancesService
    ) {}

    
}
