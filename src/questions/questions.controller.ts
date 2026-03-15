import { Body, Controller, Delete, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { AuthGuard } from '@nestjs/passport';
import { FlagQuestionDTO } from 'src/models/question/flag-question.dto';
import { RoleGuard } from 'src/middleware/guards/role.guard';
import { UpdateQuestionDTO } from 'src/models/question/update-question.dto';
import { Question } from 'src/data/entities/question.entity';
import { ReviewFlaggedQuestionDTO } from 'src/models/question/review-flagged-question.dto';
import { StateGuard } from 'src/middleware/guards/state.guard';
import { GetAllQuestionsQueryDto } from 'src/models/question/get-all-questions.dto';
import { MostWrongQuestionDTO } from 'src/models/question-instance/most-wrong-question.dto';
import { CategoryErrorPercentageDTO } from 'src/models/category/category-error-percentage.dto';
import { QuestionPreviewDTO } from 'src/models/question/question-preview.dto';

@Controller('api/v1/')
export class QuestionsController {
    public constructor(
        private readonly questionsService: QuestionsService
    ) { }

    @Get('question')
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    public async getAllQuestions(@Query() query: GetAllQuestionsQueryDto): Promise<ReviewFlaggedQuestionDTO[]> {
        const { category, limit, cursorId, search } = query;

        return this.questionsService.getAllQuestions(category, limit, cursorId, search);
    }

    @Get('question/category_error_percentage')
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    public async getCategoryErrorPercentage(): Promise<CategoryErrorPercentageDTO[]> {
        return this.questionsService.getErrorPercentageBycategory();
    }

    @Get('question/frequently_wrong')
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    public async getMostFrequentlyWrongQuestions(): Promise<MostWrongQuestionDTO[]> {
        return this.questionsService.getMostFrequentlyWrongQuestions();
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

    @Get('question/preview/:questionID')
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    public async getQuestionPreview(@Param('questionID') questionID: string): Promise<QuestionPreviewDTO> {
        return await this.questionsService.getQuestionPreview(questionID)
    }

    @Get('question/:questionID')
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    public async getQuestion(@Param('questionID') questionID: string): Promise<Question> {
        return this.questionsService.getQuestionByID(questionID);
    }

    @Delete('question/:questionID')
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    public async deleteQuestion(@Param('questionID') questionID: string): Promise<string> {
        return this.questionsService.deleteQuestion(questionID);
    }
}
