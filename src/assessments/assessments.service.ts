import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from 'src/data/entities/assessment.entity';
import { QuestionsService } from 'src/questions/questions.service';
import { DataSource, Repository, LessThanOrEqual, EntityManager } from 'typeorm';
import { QuestionInstancesService } from 'src/question-instances/question-instances.service';
import { CreateAssessmentDTO } from 'src/models/assessment/create-assessment.dto';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { PASSING_GRADE } from 'src/constants';
import { Category } from 'src/data/entities/category.entity';
import { AssignAssessmentDTO } from 'src/models/assessment/assign-assessment.dto';
import { Request } from 'express';
import { AuthService } from 'src/auth/auth/auth.service';
import { AssignmentsService } from 'src/assignments/assignments.service';
import { User } from 'src/data/entities/user.entity';

@Injectable()
export class AssessmentsService {
  public constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly questionsService: QuestionsService,
    private readonly questionInstanceService: QuestionInstancesService,
    private readonly authService: AuthService,
    private readonly assignmentService: AssignmentsService
  ) { }

  @Cron('*/30 * * * * *')
  async checkDeadlines() {
    const now = new Date();

    await this.assessmentRepository.update(
      {
        deadline: LessThanOrEqual(now),
        submitted: false,
        is_assigned: true,
      },
      {
        status: 'Submitted',
        submitted: true,
        pass: false,
        time_ended: now,
      },
    );
  }

  public async submitAssessment(assessmentID: string, requestUserId: string): Promise<Assessment> {
    try {
      const assessment: Assessment = await this.assessmentRepository.findOne({
        where: { id: assessmentID },
        relations: ['user'],
      });

      if (!assessment || assessment.user?.id !== requestUserId) {
        throw new CustomException('You do not have access to this assessment.', 403);
      }

      const category: Category = await this.categoryRepository
        .createQueryBuilder('category')
        .where('category.name = :name', { name: assessment.exam_type })
        .getOne();

      const passingGrade = category?.passing_grade || PASSING_GRADE;

      const questionInstances =
        await this.questionInstanceService.getQIStatus(assessmentID);

      const totalCount = questionInstances.length;
      const correctCount = questionInstances.reduce(
        (a, c) => ((a += c.is_correct ? 1 : 0), a),
        0,
      );
      const grade = totalCount ? (correctCount / totalCount) * 100 : 0;

      const updateAssessment: Partial<Assessment> = {
        grade,
        time_ended: new Date(),
        status: 'Finished',
        submitted: true,
        pass: Math.ceil(grade) >= passingGrade,
      };

      await this.assessmentRepository.update(assessmentID, {
        ...assessment,
        ...updateAssessment,
      });
      return await this.assessmentRepository.findOne({
        where: { id: assessmentID },
      });
    } catch (ex) {
      throw new CustomException(
        `Assessment Service error while grading assessment: ${ex.message}`,
        ex.statusCode,
      );
    }
  }

  public async getActiveAssessment(userID: string): Promise<Assessment> {
    try {
      const ongoingAssessment = await this.assessmentRepository
        .createQueryBuilder('assessment')
        // .select([
        //   'assessment.id',
        //   'assessment.time_started',
        //   'assessment.exam_type',
        //   'assessment.is_assigned'
        // ])
        .where('assessment.userId = :user', { user: userID })
        .andWhere('assessment.submitted = :submitted', { submitted: false })
        .andWhere('assessment.is_assigned = :is_assigned', { is_assigned: false })
        .getOne();

        console.log(ongoingAssessment)

      return ongoingAssessment
    } catch (ex) {
      throw new CustomException(
        `Assessment Service error while retrieving active assessment: ${ex.message}`,
        ex.statusCode,
      );
    }
  }

  public async getMyAssessments(
    userID: string,
    limit?: number,
    cursorTime?: string,
    cursorId?: string,
    is_assigned?: boolean,
    is_pending?: boolean
  ): Promise<Assessment[]> {

    const qb = this.assessmentRepository
      .createQueryBuilder('assessment')
      .where('assessment.userId = :user', { user: userID })
      .orderBy('assessment.deadline', 'ASC')
      .addOrderBy('assessment.id', 'DESC');

    if (is_assigned !== undefined) {
      qb.andWhere('assessment.is_assigned = :isAssigned', {
        isAssigned: is_assigned
      });
    }

    if (is_pending !== undefined) {
      qb.andWhere('assessment.submitted = :isSubmitted', {
        isSubmitted: !is_pending
      })
    }

    if (cursorTime && cursorId) {
      qb.andWhere(
        `(assessment.time_started < :cursorTime OR
      (assessment.time_started = :cursorTime AND assessment.id < :cursorId))`,
        { cursorTime, cursorId }
      );
    }


    if (limit) {
      qb.take(limit);
    }

    return await qb.getMany();
  }


  public async createRandomAssessment(
    payload: CreateAssessmentDTO,
    manager?: EntityManager
  ): Promise<Assessment> {
    try {
      const repo = manager
        ? manager.getRepository(Assessment)
        : this.assessmentRepository;

      if (!payload.is_assigned) {
        const ongoingAssessment = await this.getActiveAssessment(payload.user);

                // console.log(`${ongoingAssessment}, ${typeof ongoingAssessment}, ${payload.user}`)

        if (ongoingAssessment) {
          throw new CustomException(
            'You can only have one active training assessment.',
            400,
          );
        }
      }

      const newAssessment = await repo
        .createQueryBuilder()
        .insert()
        .into(Assessment)
        .values({
          time_started: new Date(),
          exam_type: payload.exam_type,
          user: { id: payload.user },
        })
        .execute();

      const assessmentId = newAssessment.identifiers[0].id;

      const randomQuestionsBatch = await this.questionsService.getRandomBatch(
        payload.exam_type,
      );

      await this.questionInstanceService.createQuestionInstances(
        randomQuestionsBatch,
        assessmentId,
        manager
      );

      const fullAssessment = await repo
        .createQueryBuilder('assessment')
        .select([
          'assessment.id',
          'assessment.time_started',
          'assessment.exam_type',
        ])
        .where('assessment.id = :id', { id: assessmentId })
        .andWhere('assessment.is_deleted = :is_deleted', { is_deleted: false })
        .getOne();

      return fullAssessment;

    } catch (ex) {
      throw new CustomException(
        `Assessment Service error while creating record: ${ex.message}`,
        ex.statusCode || 500,
      );
    }
  }

  public async assignAssessment(
    payload: AssignAssessmentDTO,
    request: Request
  ): Promise<Assessment[]> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const createdAssessments: Assessment[] = [];
        let currentUser = new User;
        let assignment = '';

        try {
          currentUser = await this.authService.getCurrentUser(request);
        } catch (ex) {
          throw new CustomException(
            `Failed to get current user: ${ex.message}`,
            ex.statusCode,
          );
        }

        try {
          assignment = await this.assignmentService.createAssignment({ ...payload, assigned_by: currentUser });
        } catch (ex) {
          throw new CustomException(
            `Failed to create assignment: ${ex.message}`,
            ex.statusCode,
          );
        }

        for (const userId of payload.users) {
          let newAssessment: Assessment;

          try {
            newAssessment = await this.createRandomAssessment(
              {
                exam_type: payload.exam_type,
                user: userId,
                is_assigned: true
              },
              manager
            );
          } catch (ex) {
            throw new CustomException(
              `Failed to create assessment for user ${userId}: ${ex.message}`,
              ex.statusCode,
            );
          }

          try {
            await manager.update(Assessment, newAssessment.id, {
              is_assigned: true,
              attempts: payload.attempts,
              time_started: null,
              deadline: payload.deadline,
              assignment: { id: assignment }
            });


            const assigned = await manager.findOne(Assessment, {
              where: { id: newAssessment.id },
            });

            if (!assigned) {
              throw new CustomException(
                `Could not fetch assigned assessment for user ${userId}`,
                500
              );
            }

            createdAssessments.push(assigned);
          } catch (ex) {
            throw new CustomException(
              `Error while assigning assessment for user ${userId}: ${ex.message}`,
              ex.statusCode,
            );
          }
        }

        return createdAssessments;
      });
    } catch (ex: any) {
      throw new CustomException(
        `Assessment Service error during batch assignment: ${ex.message}`,
        ex.statusCode || 500,
      );
    }
  }


  public async startAssignedAssessment(
    assessmentID: string,
    requestUserId: string,
  ): Promise<Assessment> {
    try {
      const assessment: Assessment = await this.assessmentRepository.findOne({
        where: { id: assessmentID },
        relations: ['user'],
      });

      if (!assessment || assessment.user?.id !== requestUserId) {
        throw new CustomException('You do not have access to this assessment.', 403);
      }

      if (!assessment.is_assigned) {
        throw new CustomException(
          'Only assigned assessments can be started with this method.',
          400,
        );
      }

      if (assessment.time_started) {
        throw new CustomException(
          'This assigned assessment has already been started.',
          400,
        );
      }

      await this.assessmentRepository.update(assessmentID, {
        time_started: new Date(),
      });

      return await this.assessmentRepository.findOne({
        where: { id: assessmentID },
      });
    } catch (ex) {
      throw new CustomException(
        `Assessment Service error while starting assigned assessment: ${ex.message}`,
        ex.statusCode,
      );
    }
  }

  public async getAssignedAssessments(): Promise<Assessment[]> {
    return this.assessmentRepository.find({
      where: {
        is_assigned: true,
        submitted: false
      }
    });
  }

  public async getAssessmentCategory(assessmentID: string): Promise<string> {
    const assessment = await this.assessmentRepository.findOne({ where: { id: assessmentID } })
    return assessment.exam_type
  }
}
