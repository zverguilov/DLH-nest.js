import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { AuthGuard } from '@nestjs/passport';
import { FlagQuestionDTO } from 'src/models/question/flag-question.dto';
import { RoleGuard } from 'src/middleware/guards/role.guard';
import { UpdateQuestionDTO } from 'src/models/question/update-question.dto';
import { Question } from 'src/data/entities/question.entity';
import { ReviewFlaggedQuestionDTO } from 'src/models/question/review-flagged-question.dto';

@Controller('api/v1/')
export class QuestionsController {
    public constructor (
        private readonly questionsService: QuestionsService
    ) { }

    @Get('question/flagged')
    @UseGuards(AuthGuard(), RoleGuard)
    public async getFlaggedQuestions(): Promise<ReviewFlaggedQuestionDTO[]> {
        return this.questionsService.getFlaggedQuestions();
    }

    @Put('question')
    @UseGuards(AuthGuard(), RoleGuard)
    public async updateQuestion(@Body() questionInfo: UpdateQuestionDTO): Promise<string> {
        return this.questionsService.updateQuestion(questionInfo);
    }
}
