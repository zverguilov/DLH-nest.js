import { Module } from "@nestjs/common";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";
import { Comment } from "src/data/entities/comment.entity";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QuestionsService } from "src/questions/questions.service";
import { Question } from "src/data/entities/question.entity";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Comment]),
    TypeOrmModule.forFeature([Question])
  ],
    controllers: [CommentsController],
    providers: [CommentsService, QuestionsService]
  })
  export class CommentsModule {}
  