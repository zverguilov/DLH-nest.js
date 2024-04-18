import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Comment } from "src/data/entities/comment.entity";
import { CustomException } from "src/middleware/exception/custom-exception";
import { CommentCreatedDTO } from "src/models/comment/comment-created.dto";
import { FlagQuestionDTO } from "src/models/question/flag-question.dto";
import { QuestionsService } from "src/questions/questions.service";
import { Repository } from "typeorm";

@Injectable()
export class CommentsService {
    public constructor(
        @InjectRepository(Comment) private readonly commentRepository: Repository<Comment>,
        private readonly questionsService: QuestionsService
    ) { }

    public async flag(payload: FlagQuestionDTO): Promise<CommentCreatedDTO> {
        try {
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
                content: newComment.identifiers[0].content
            }

        } catch (ex) {
            throw new CustomException(`Comment Service flag error: ${ex.message}`, ex.statusCode)
        }
    }
}