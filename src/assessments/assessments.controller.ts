import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { Assessment } from 'src/data/entities/assessment.entity';
import { AuthGuard } from '@nestjs/passport';
import { CreateAssessmentDTO } from 'src/models/assessment/create-assessment.dto';
import { StateGuard } from 'src/middleware/guards/state.guard';
import { AssignAssessmentDTO } from 'src/models/assessment/assign-assessment.dto';
import { RoleGuard } from 'src/middleware/guards/role.guard';
import { Request } from 'express';

@Controller('api/v1')
export class AssessmentsController {
  public constructor(private readonly assessmentService: AssessmentsService) { }

  @Get('assessment/assigned') //service endpoint, maintenance purposes through Postman only
  @UseGuards(AuthGuard(), RoleGuard, StateGuard)
  public async getAssignedAssessments(): Promise<Assessment[]> {
    return await this.assessmentService.getAssignedAssessments();
  }

  @Get('assessment/ongoing/:userID')
  @UseGuards(AuthGuard(), StateGuard)
  public async getActiveAssessment(
    @Param('userID') userID: string,
  ): Promise<Assessment> {
    return await this.assessmentService.getActiveAssessment(userID);
  }

  @Get('assessment/category/:assessmentID')
  @UseGuards(AuthGuard(), StateGuard)
  public async getAssessmentCategory(
    @Param('assessmentID') assessmentID: string
  ): Promise<string> {
    return this.assessmentService.getAssessmentCategory(assessmentID);
  }

  @Get('assessment/list/:userID')
  @UseGuards(AuthGuard(), StateGuard)
  public async getUserAssessments(
    @Param('userID') userID: string,
    @Query('limit') limit?: string,
    @Query('cursorTime') cursorTime?: string,
    @Query('cursorId') cursorId?: string,
    @Query('is_assigned') is_assigned?: string,
    @Query('is_pending') is_pending?: string
  ): Promise<Assessment[]> {
    return await this.assessmentService.getMyAssessments(
      userID,
      limit ? +limit : undefined,
      cursorTime,
      cursorId,
      is_assigned == '1' ? true : is_assigned == '0' ? false : undefined,
      is_pending == '1' ? true : is_pending == '0' ? false : undefined
    );
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
    @Req() request: Request
  ): Promise<Assessment[]> {
    return await this.assessmentService.assignAssessment(payload, request);
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
