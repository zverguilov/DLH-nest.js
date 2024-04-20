import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/middleware/guards/role.guard';
import { AnswersService } from './answers.service';
import { UpdateAnswerDTO } from 'src/models/answer/update-answer.dto';

@Controller('api/v1/')
export class AnswersController {
    public constructor (
        private readonly answersService: AnswersService
    ) { }

    @Put('answer')
    @UseGuards(AuthGuard(), RoleGuard)
    public async updateAnswer(@Body() answerInfo: UpdateAnswerDTO): Promise<string> {
        return this.answersService.updateAnswer(answerInfo);
    }
}