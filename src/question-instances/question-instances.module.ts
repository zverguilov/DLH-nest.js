import { Module } from '@nestjs/common';
import { QuestionInstancesController } from './question-instances.controller';
import { QuestionInstancesService } from './question-instances.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { AnswersService } from 'src/answers/answers.service';
import { Answer } from 'src/data/entities/answer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionInstance]),
    TypeOrmModule.forFeature([Answer])
  ],
  controllers: [QuestionInstancesController],
  providers: [QuestionInstancesService, AnswersService]
})
export class QuestionInstancesModule {}
