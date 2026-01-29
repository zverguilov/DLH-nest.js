import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from 'src/data/entities/assessment.entity';
import { Question } from 'src/data/entities/question.entity';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { QuestionsService } from 'src/questions/questions.service';
import { QuestionInstancesService } from 'src/question-instances/question-instances.service';
import { AnswersService } from 'src/answers/answers.service';
import { Answer } from 'src/data/entities/answer.entity';
import { PassportModule } from '@nestjs/passport';
import { User } from 'src/data/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { Category } from 'src/data/entities/category.entity';
import { CategoryService } from 'src/category/category.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Assessment]),
    TypeOrmModule.forFeature([Question]),
    TypeOrmModule.forFeature([QuestionInstance]),
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Answer]),
    TypeOrmModule.forFeature([Category]),
  ],
  controllers: [AssessmentsController],
  providers: [
    AssessmentsService,
    QuestionsService,
    QuestionInstancesService,
    AnswersService,
    UsersService,
    CategoryService,
  ],
})
export class AssessmentsModule {}
