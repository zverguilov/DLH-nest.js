import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { QuestionInstancesService } from './question-instances.service';
import { MarkPayloadDTO } from 'src/models/others/mark-payload.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetQuestionInstanceDTO } from 'src/models/question-instance/get-question-instance.dto';

@Controller('api/v1')
export class QuestionInstancesController {
    public constructor(
        private readonly questionInstanceService: QuestionInstancesService
    ) {}

    @Get('assessment/:assessmentID/:questionNumber')
    public async getQuestionInstancePackage(@Param('assessmentID') assessmentID: string, @Param('questionNumber') questionNumber: number): Promise<GetQuestionInstanceDTO> {
        return this.questionInstanceService.getQuestionInstancePackage(assessmentID, questionNumber);
    }
    
    @Put('mark/:instanceID')
    @UseGuards(AuthGuard())
    public async mark(@Param('instanceID') instanceID: string, @Body() payload: MarkPayloadDTO): Promise<string> {
        return await this.questionInstanceService.mark(instanceID, payload);
    }
}
