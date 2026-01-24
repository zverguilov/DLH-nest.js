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

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Question]),
    TypeOrmModule.forFeature([Answer]),
    TypeOrmModule.forFeature([Category]),
    TypeOrmModule.forFeature([Question])
],
  controllers: [LoadController],
  providers: [LoadService, CategoryService, QuestionsService]
})
export class LoadModule {}
