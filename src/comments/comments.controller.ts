import { Body, Controller, Put, UseGuards } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { AuthGuard } from "@nestjs/passport";
import { FlagQuestionDTO } from "src/models/question/flag-question.dto";
import { Comment } from "src/data/entities/comment.entity";

@Controller('api/v1/flag')
export class CommentsController {
    public constructor(
        private readonly commentsService: CommentsService
    ) { }

    @Put()
    @UseGuards(AuthGuard())
    public async flag(@Body() payload: FlagQuestionDTO): Promise<Comment> {
        return this.commentsService.flag(payload)
    }
}
