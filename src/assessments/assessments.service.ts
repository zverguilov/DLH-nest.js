import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from 'src/data/entities/assessment.entity';
import { QuestionsService } from 'src/questions/questions.service';
import { Like, Repository } from 'typeorm';
import { QuestionInstancesService } from 'src/question-instances/question-instances.service';
import { CreateAssessmentDTO } from 'src/models/assessment/create-assessment.dto';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { PASSING_GRADE } from 'src/constants';

@Injectable()
export class AssessmentsService {
    public constructor(
        @InjectRepository(Assessment) private readonly assessmentRepository: Repository<Assessment>,
        private readonly questionsService: QuestionsService,
        private readonly questionInstanceService: QuestionInstancesService
    ) { }

    public async submitAssessment(assessmentID: string): Promise<Assessment> {
        try {
            let assessment: Assessment = await this.assessmentRepository.findOne({ where: { id: assessmentID } })
            let questionInstances = await this.questionInstanceService.getQIStatus(assessmentID);
    
            const updateAssessment: Partial<Assessment> = {
                grade: (questionInstances.reduce((a, c) => (a += c.is_correct ? 1 : 0, a), 0) / 60) * 100,
                time_ended: new Date(),
                status: 'Finished',
                submitted: true,
                pass: Math.ceil(((questionInstances.reduce((a, c) => (a += c.is_correct ? 1 : 0, a), 0) / 60) * 100)) >= PASSING_GRADE ? true : false
            }
    
            await this.assessmentRepository.update(assessmentID, { ...assessment, ...updateAssessment })
            return await this.assessmentRepository.findOne({ where: { id: assessmentID } });

        } catch (ex) {
            throw new CustomException(`Assessment Service error while grading assessment: ${ex.message}`, ex.statusCode);
        }
    }

    public async getActiveAssessment(userID: string): Promise<Assessment> {
        try {
            let ongoingAssessment = await this.assessmentRepository.createQueryBuilder('assessment')
                .select([
                    'assessment.id',
                    'assessment.time_started',
                    'assessment.exam_type'
                ])
                .where('assessment.user = :user', { user: userID })
                .andWhere('assessment.submitted = :submitted', { submitted: false })
                .getOne()

            return ongoingAssessment

        } catch (ex) {
            throw new CustomException(`Assessment Service error while retrieving active assessment: ${ex.message}`, ex.statusCode);
        }
    }

    public async getMyAssessments(userID: string): Promise<Assessment[]> {
        try {
            let assessments = await this.assessmentRepository.createQueryBuilder('assessment')
                .where('assessment.user = :user', { user: userID })
                .andWhere('assessment.submitted = :submitted', { submitted: true })
                .andWhere('assessment.is_deleted = :is_deleted', { is_deleted: false })
                .getMany()

            return assessments
        } catch (ex) {
            throw new CustomException(`Assessment Service mass retrieval error: ${ex.message}`, ex.statusCode);
        }
    }

    public async createRandomAssessment(payload: CreateAssessmentDTO): Promise<Assessment> {
        try {
            let ongoingAssessment = await this.assessmentRepository.createQueryBuilder('assessment')
                .where('assessment.user = :user', { user: payload.user })
                .andWhere('assessment.submitted = :submitted', { submitted: false })
                .andWhere('assessment.is_deleted = :is_deleted', { is_deleted: false })
                .getOne()

            if (ongoingAssessment) throw new CustomException('You can only have one active assessment.', 400)

            let newAssessment = await this.assessmentRepository.createQueryBuilder()
                .insert()
                .into('assessment')
                .values({
                    time_started: new Date(),
                    exam_type: payload.exam_type,
                    user: payload.user
                })
                .execute()

            let randomQuestionsBatch = await this.questionsService.getRandomBatch(payload.exam_type);
            await this.questionInstanceService.createQuestionInstances(randomQuestionsBatch, newAssessment.identifiers[0].id);

            let fullAssessment = await this.assessmentRepository.createQueryBuilder('assessment')
                .select([
                    'assessment.id',
                    'assessment.time_started',
                    'assessment.exam_type'
                ])
                .where('assessment.id = :id', { id: newAssessment.identifiers[0].id })
                .andWhere('assessment.is_deleted = :is_deleted', { is_deleted: false })
                .getOne();

            return fullAssessment;

        } catch (ex) {
            throw new CustomException(`Assessment Service error while creating record: ${ex.message}`, ex.statusCode)
        }
    }
}
