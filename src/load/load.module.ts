import { Module } from '@nestjs/common';
import { LoadController } from './load.controller';
import { LoadService } from './load.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from 'src/data/entities/question.entity';
import { Answer } from 'src/data/entities/answer.entity';
import { PassportModule } from '@nestjs/passport';
import { CategoryService } from 'src/category/category.service';
import { Category } from 'src/data/entities/category.entity';
import { QuestionsService } from 'src/questions/questions.service';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { Comment } from 'src/data/entities/comment.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Question, Answer, Category, QuestionInstance, Comment]),
],
  controllers: [LoadController],
  providers: [LoadService, CategoryService, QuestionsService, QuestionInstance]
})
export class LoadModule {}
