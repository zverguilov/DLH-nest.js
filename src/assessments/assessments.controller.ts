import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { Assessment } from 'src/data/entities/assessment.entity';
import { AuthGuard } from '@nestjs/passport';
import { CreateAssessmentDTO } from 'src/models/assessment/create-assessment.dto';
import { StateGuard } from 'src/middleware/guards/state.guard';
import { AssignAssessmentDTO } from 'src/models/assessment/assign-assessment.dto';
import { RoleGuard } from 'src/middleware/guards/role.guard';

@Controller('api/v1')
export class AssessmentsController {
  public constructor(private readonly assessmentService: AssessmentsService) {}

  @Get('assessment/ongoing/:userID')
  @UseGuards(AuthGuard(), StateGuard)
  public async getActiveAssessment(
    @Param('userID') userID: string,
  ): Promise<Assessment> {
    return await this.assessmentService.getActiveAssessment(userID);
  }

  @Get('assessment/list/:userID')
  @UseGuards(AuthGuard(), StateGuard)
  public async getMyAssessments(
    @Param('userID') userID: string,
  ): Promise<Assessment[]> {
    return await this.assessmentService.getMyAssessments(userID);
  }

  @Post('assessment')
  @UseGuards(AuthGuard(), StateGuard)
  public async createRandomAssessment(
    @Body() payload: CreateAssessmentDTO,
  ): Promise<Assessment> {
    return await this.assessmentService.createRandomAssessment(payload);
  }

  @Post('assessment/assign')
  @UseGuards(AuthGuard(), RoleGuard, StateGuard)
  public async assignAssessment(
    @Body() payload: AssignAssessmentDTO,
  ): Promise<Assessment> {
    return await this.assessmentService.assignAssessment(payload);
  }

  @Put('assessment/start/:assessmentID')
  @UseGuards(AuthGuard(), StateGuard)
  public async startAssignedAssessment(
    @Param('assessmentID') assessmentID: string,
  ): Promise<Assessment> {
    return await this.assessmentService.startAssignedAssessment(assessmentID);
  }

  @Put('assessment/submit/:assessmentID')
  @UseGuards(AuthGuard(), StateGuard)
  public async submitAssessment(
    @Param('assessmentID') assessmentID: string,
  ): Promise<Assessment> {
    return await this.assessmentService.submitAssessment(assessmentID);
  }
}
