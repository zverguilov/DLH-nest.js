import { Body, Controller, Put, Req, UseGuards } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { AuthGuard } from "@nestjs/passport";
import { FlagQuestionDTO } from "src/models/question/flag-question.dto";
import { Comment } from "src/data/entities/comment.entity";
import { CommentCreatedDTO } from "src/models/comment/comment-created.dto";
import { Request } from "express";
import { JwtPayload } from "src/auth/auth/jwt-payload";

@Controller('api/v1/flag')
export class CommentsController {
    public constructor(
        private readonly commentsService: CommentsService
    ) { }

    @Put()
    @UseGuards(AuthGuard())
    public async flag(@Body() payload: FlagQuestionDTO, @Req() request: Request): Promise<CommentCreatedDTO> {
        return this.commentsService.flag(payload, ((request as any).user as JwtPayload).id)
    }
}
