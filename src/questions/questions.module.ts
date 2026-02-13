import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from 'src/data/entities/question.entity';
import { PassportModule } from '@nestjs/passport';
import { Category } from 'src/data/entities/category.entity';
import { CategoryService } from 'src/category/category.service';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { Answer } from 'src/data/entities/answer.entity';
import { Comment } from 'src/data/entities/comment.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Question, Category, QuestionInstance, Answer, Comment]),
  ],
  controllers: [QuestionsController],
  providers: [
    QuestionsService,
    CategoryService
  ]
})
export class QuestionsModule { }
