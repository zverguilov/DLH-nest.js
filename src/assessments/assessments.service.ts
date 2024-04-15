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

    public async createRandomAssessment(payload: CreateAssessmentDTO): Promise<Assessment> {
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
            .where('assessment.id = :id', { id: newAssessment.identifiers[0].id })
            .getOne();

        return fullAssessment;
    }
}
