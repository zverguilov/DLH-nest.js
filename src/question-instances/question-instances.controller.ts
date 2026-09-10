import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { QuestionInstancesService } from './question-instances.service';
import { MarkPayloadDTO } from 'src/models/others/mark-payload.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetQuestionInstanceDTO } from 'src/models/question-instance/get-question-instance.dto';
import { ReviewQuestionInstanceDTO } from 'src/models/question-instance/review-question-instance.dto';
import { ReportQuestionInstanceDTO } from 'src/models/question-instance/report-question-instance.dto';
import { StateGuard } from 'src/middleware/guards/state.guard';
import { Request } from 'express';
import { JwtPayload } from 'src/auth/auth/jwt-payload';

@Controller('api/v1')
export class QuestionInstancesController {
    public constructor(
        private readonly questionInstanceService: QuestionInstancesService
    ) {}

    @Get('assessment/review/:assessmentID')
    @UseGuards(AuthGuard(), StateGuard)
    public async getReviewStatus(@Param('assessmentID') assessmentID: string, @Req() request: Request): Promise<ReviewQuestionInstanceDTO[]> {
        return await this.questionInstanceService.getReviewStatus(assessmentID, ((request as any).user as JwtPayload).id);
    }

    @Get('assessment/report/:assessmentID')
    @UseGuards(AuthGuard(), StateGuard)
    public async getReport(@Param('assessmentID') assessmentID: string, @Req() request: Request): Promise<ReportQuestionInstanceDTO[]> {
        return await this.questionInstanceService.getReport(assessmentID, ((request as any).user as JwtPayload).id);
    }

    @Get('assessment/:assessmentID/:questionNumber')
    @UseGuards(AuthGuard(), StateGuard)
    public async getQuestionInstancePackage(@Param('assessmentID') assessmentID: string, @Param('questionNumber') questionNumber: number, @Req() request: Request): Promise<GetQuestionInstanceDTO> {
        return await this.questionInstanceService.getQuestionInstancePackage(assessmentID, questionNumber, ((request as any).user as JwtPayload).id);
    }

    @Put('mark/:instanceID')
    @UseGuards(AuthGuard(), StateGuard)
    public async mark(@Param('instanceID') instanceID: string, @Body() payload: MarkPayloadDTO, @Req() request: Request): Promise<string> {
        return await this.questionInstanceService.mark(instanceID, payload, ((request as any).user as JwtPayload).id);
    }}


