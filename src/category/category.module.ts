import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/data/entities/category.entity';
import { PassportModule } from '@nestjs/passport';
import { QuestionsService } from 'src/questions/questions.service';
import { Question } from 'src/data/entities/question.entity';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { Answer } from 'src/data/entities/answer.entity';
import { Comment } from 'src/data/entities/comment.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Category, Question, QuestionInstance, Answer, Comment])
  ],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    QuestionsService
  ]
})
export class CategoryModule { }
