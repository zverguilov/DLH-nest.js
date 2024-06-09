import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { AuthGuard } from '@nestjs/passport';
import { FlagQuestionDTO } from 'src/models/question/flag-question.dto';
import { RoleGuard } from 'src/middleware/guards/role.guard';
import { UpdateQuestionDTO } from 'src/models/question/update-question.dto';
import { Question } from 'src/data/entities/question.entity';
import { ReviewFlaggedQuestionDTO } from 'src/models/question/review-flagged-question.dto';
import { StateGuard } from 'src/middleware/guards/state.guard';

@Controller('api/v1/')
export class QuestionsController {
    public constructor (
        private readonly questionsService: QuestionsService
    ) { }

    @Get('question')
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    public async getAllQuestions(@Query() query: {category}): Promise<ReviewFlaggedQuestionDTO[]> {
        return this.questionsService.getAllQuestions(query.category);
    }

    @Get('question/flagged')
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    public async getFlaggedQuestions(): Promise<ReviewFlaggedQuestionDTO[]> {
        return this.questionsService.getFlaggedQuestions();
    }

    @Put('question')
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    public async updateQuestion(@Body() questionInfo: UpdateQuestionDTO): Promise<string> {
        return this.questionsService.updateQuestion(questionInfo);
    }
}
