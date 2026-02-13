import { Module } from "@nestjs/common";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";
import { Comment } from "src/data/entities/comment.entity";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QuestionsService } from "src/questions/questions.service";
import { Question } from "src/data/entities/question.entity";
import { Category } from "src/data/entities/category.entity";
import { QuestionInstance } from "src/data/entities/question_instance.entity";
import { Answer } from "src/data/entities/answer.entity";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Comment, Question, Category, QuestionInstance, Answer]),
  ],
    controllers: [CommentsController],
    providers: [CommentsService, QuestionsService, QuestionInstance]
  })
  export class CommentsModule {}
  