import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments/assessments.controller';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';

@Module({
  controllers: [AssessmentsController],
  providers: [AssessmentsService]
})
export class AssessmentsModule {}
