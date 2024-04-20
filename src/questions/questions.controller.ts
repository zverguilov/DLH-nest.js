import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { AuthGuard } from '@nestjs/passport';
import { FlagQuestionDTO } from 'src/models/question/flag-question.dto';
import { RoleGuard } from 'src/middleware/guards/role.guard';
import { UpdateQuestionDTO } from 'src/models/question/update-question.dto';
import { Question } from 'src/data/entities/question.entity';

@Controller('api/v1/')
export class QuestionsController {
    public constructor (
        private readonly questionsService: QuestionsService
    ) { }

    @Put('question')
    @UseGuards(AuthGuard(), RoleGuard)
    public async updateQuestion(@Body() questionInfo: UpdateQuestionDTO): Promise<string> {
        return this.questionsService.updateQuestion(questionInfo);
    }
}
