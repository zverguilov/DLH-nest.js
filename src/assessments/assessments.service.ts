import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from 'src/data/entities/assessment.entity';
import { QuestionsService } from 'src/questions/questions.service';
import { Like, Repository } from 'typeorm';
import { QuestionInstancesService } from 'src/question-instances/question-instances.service';
import { CreateAssessmentDTO } from 'src/models/assessment/create-assessment.dto';

@Injectable()
export class AssessmentsService {
    public constructor(
        @InjectRepository(Assessment) private readonly assessmentRepository: Repository<Assessment>,
        private readonly questionsService: QuestionsService,
        private readonly questionInstanceService: QuestionInstancesService
    ) { }

    public async getActiveAssessment(userID: string): Promise<Assessment> {
        let ongoingAssessment = await this.assessmentRepository.createQueryBuilder('assessment')
            .leftJoin('assessment.question_instances', 'questionInstance')
            .leftJoin('questionInstance.question', 'question')
            .leftJoin('question.answers', 'answer')
            .leftJoin('assessment.user', 'user')
            .select([
                'assessment.id',
                'assessment.time_started',
                'assessment.exam_type',
                'user.id',
                'user.full_name',
                'questionInstance.id',
                'question.id',
                'question.body',
                'answer.id',
                'answer.body'
            ])
            .where('assessment.user = :user', { user: userID })
            .andWhere('assessment.submitted = :submitted', { submitted: false })
            .getOne()

            return ongoingAssessment
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
            throw `Assessment Service mass retrieval error: ${ex.message}`
        }
    }

    public async createRandomAssessment(payload: CreateAssessmentDTO): Promise<Assessment> {
        try {
            let ongoingAssessment = await this.assessmentRepository.createQueryBuilder('assessment')
            .where('assessment.user = :user', { user: payload.user })
            .andWhere('assessment.submitted = :submitted', { submitted: false })
            .andWhere('assessment.is_deleted = :is_deleted', { is_deleted: false })
            .getOne()
            
            if (ongoingAssessment) throw new Error('You can only have one active assessment.') 
            
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
                // .leftJoin('assessment.question_instances', 'questionInstance')
                // .leftJoin('questionInstance.question', 'question')
                // .leftJoin('question.answers', 'answer')
                // .leftJoin('assessment.user', 'user')
                .select([
                    'assessment.id',
                    'assessment.time_started',
                    'assessment.exam_type',
                    // 'user.id',
                    // 'user.full_name',
                    // 'questionInstance.id',
                    // 'question.id',
                    // 'question.body',
                    // 'answer.id',
                    // 'answer.body'
                ])
                .where('assessment.id = :id', { id: newAssessment.identifiers[0].id })
                .andWhere('assessment.is_deleted = :is_deleted', { is_deleted: false })
                .getOne();

            return fullAssessment;

        } catch (ex) {
            throw `Assessment Service error while creating record: ${ex.message}`
        }
    }
}
