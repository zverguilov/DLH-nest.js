import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { AuthGuard } from '@nestjs/passport';
import { FlagQuestionDTO } from 'src/models/question/flag-question.dto';

@Controller('question')
export class QuestionsController {
    public constructor (
        private readonly questionsService: QuestionsService
    ) { }
}
