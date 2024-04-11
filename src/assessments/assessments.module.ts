import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from 'src/data/entities/assessment.entity';
import { Question } from 'src/data/entities/question.entity';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { QuestionsService } from 'src/questions/questions.service';
import { QuestionInstancesService } from 'src/question-instances/question-instances.service';

@Module({imports: [
  TypeOrmModule.forFeature([Assessment]),
  TypeOrmModule.forFeature([Question]),
  TypeOrmModule.forFeature([QuestionInstance])
],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, QuestionsService, QuestionInstancesService]
})
export class AssessmentsModule {}
