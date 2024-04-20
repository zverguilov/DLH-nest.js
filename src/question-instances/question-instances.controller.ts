import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { QuestionInstancesService } from './question-instances.service';
import { MarkPayloadDTO } from 'src/models/others/mark-payload.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetQuestionInstanceDTO } from 'src/models/question-instance/get-question-instance.dto';
import { ReviewQuestionInstanceDTO } from 'src/models/question-instance/review-question-instance.dto';

@Controller('api/v1')
export class QuestionInstancesController {
    public constructor(
        private readonly questionInstanceService: QuestionInstancesService
    ) {}

    @Get('assessment/review/:assessmentID')
    @UseGuards(AuthGuard())
    public async getReviewStatus(@Param('assessmentID') assessmentID: string): Promise<ReviewQuestionInstanceDTO[]> {
        return await this.questionInstanceService.getReviewStatus(assessmentID);
    }

    @Get('assessment/:assessmentID/:questionNumber')
    @UseGuards(AuthGuard())
    public async getQuestionInstancePackage(@Param('assessmentID') assessmentID: string, @Param('questionNumber') questionNumber: number): Promise<GetQuestionInstanceDTO> {
        return await this.questionInstanceService.getQuestionInstancePackage(assessmentID, questionNumber);
    }
    
    @Put('mark/:instanceID')
    @UseGuards(AuthGuard())
    public async mark(@Param('instanceID') instanceID: string, @Body() payload: MarkPayloadDTO): Promise<string> {
        return await this.questionInstanceService.mark(instanceID, payload);
    }}


