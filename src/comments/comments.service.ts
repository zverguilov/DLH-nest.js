import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Comment } from "src/data/entities/comment.entity";
import { FlagQuestionDTO } from "src/models/question/flag-question.dto";
import { QuestionsService } from "src/questions/questions.service";
import { Repository } from "typeorm";

@Injectable()
export class CommentsService {
    public constructor(
        @InjectRepository(Comment) private readonly commentRepository: Repository<Comment>,
        private readonly questionsService: QuestionsService
    ) { }

    public async flag(payload: FlagQuestionDTO): Promise<Comment> {
        let newComment = await this.commentRepository.createQueryBuilder()
        .insert()
        .into('comment')
        .values({
            question: payload.question_id,
            user: payload.user_id,
            content: payload.content
        })
        .execute()

        await this.questionsService.flagQuestion(payload.question_id);

        return {
            id: newComment.identifiers[0].id,
            question: newComment.identifiers[0].question,
            user: newComment.identifiers[0].user,
            content: newComment.identifiers[0].content
        }
    }
}