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
import { Comment } from 'src/data/entities/comment.entity';
import { AuthService } from 'src/auth/auth/auth.service';
import { AssignmentsService } from 'src/assignments/assignments.service';
import { JwtService } from '@nestjs/jwt';
import { Assignment } from 'src/data/entities/assignment.entity';
import { ConfigService } from 'src/config/config.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Assessment, Assignment, Question, QuestionInstance, User, Answer, Category, Comment])
  ],
  controllers: [AssessmentsController],
  providers: [
    AssessmentsService,
    QuestionsService,
    QuestionInstancesService,
    AnswersService,
    UsersService,
    CategoryService,
    AuthService,
    AssignmentsService,
    JwtService,
    ConfigService
  ],
})
export class AssessmentsModule {}
