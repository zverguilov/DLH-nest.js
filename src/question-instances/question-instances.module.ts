import { Module } from '@nestjs/common';
import { QuestionInstancesController } from './question-instances.controller';
import { QuestionInstancesService } from './question-instances.service';

@Module({
  controllers: [QuestionInstancesController],
  providers: [QuestionInstancesService]
})
export class QuestionInstancesModule {}
