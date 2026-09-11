import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AnswersService } from 'src/answers/answers.service';
import { Answer } from 'src/data/entities/answer.entity';
import { Assessment } from 'src/data/entities/assessment.entity';
import { Question } from 'src/data/entities/question.entity';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { MarkPayloadDTO } from 'src/models/others/mark-payload.dto';
import { GetQuestionInstanceDTO } from 'src/models/question-instance/get-question-instance.dto';
import { QuestionInstanceStatusDTO } from 'src/models/question-instance/question-instance-status.dto';
import { AssessmentReportDTO } from 'src/models/question-instance/assessment-report.dto';
import { ReviewQuestionInstanceDTO } from 'src/models/question-instance/review-question-instance.dto';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class QuestionInstancesService {
    public constructor(
        @InjectRepository(QuestionInstance) private readonly questionInstanceRepository: Repository<QuestionInstance>,
        @InjectRepository(Answer) private readonly answerRepository: Repository<Answer>,
        @InjectRepository(Assessment) private readonly assessmentRepository: Repository<Assessment>,
        private readonly answersService: AnswersService,
    ) { }

    private async verifyAssessmentOwnership(assessmentID: string, requestUserId: string): Promise<void> {
        const assessment = await this.assessmentRepository.findOne({
            where: { id: assessmentID },
            relations: ['user'],
        });

        if (!assessment || assessment.user?.id !== requestUserId) {
            throw new CustomException('You do not have access to this assessment.', 403);
        }
    }

    public async getQIStatus(assessmentID: string): Promise<QuestionInstanceStatusDTO[]> {
        try {
            return await this.questionInstanceRepository.createQueryBuilder('question_instance')
                .where('question_instance.assessment = :id', { id: assessmentID })
                .select('question_instance.is_correct')
                .getMany()

        } catch (ex) {
            throw new CustomException(`Question Instance Service error while retrieving question instances status: ${ex.message}`, ex.statusCode)
        }
    }

    public async getReport(assessmentID: string, requestUserId: string): Promise<AssessmentReportDTO> {
        try {
            await this.verifyAssessmentOwnership(assessmentID, requestUserId);

            const total = await this.questionInstanceRepository.createQueryBuilder('question_instance')
                .where('question_instance.assessment = :id', { id: assessmentID })
                .getCount();

            const questions = await this.questionInstanceRepository.createQueryBuilder('question_instance')
                .where('question_instance.assessment = :id', { id: assessmentID })
                .andWhere('question_instance.is_correct = false')
                .leftJoin('question_instance.question', 'question')
                .leftJoin('question.answers', 'answer')
                .select([
                    'question_instance.id',
                    'question_instance.assessment_index',
                    'question_instance.correct_answers',
                    'question_instance.selected_answers',
                    'question.id',
                    'question.body',
                    'answer.id',
                    'answer.body',
                    'answer.is_correct'
                ])
                .getMany();

            return { total, questions };

        } catch (ex) {
            throw new CustomException(`Question Instance Service error while generating assessment report: ${ex.message}`, ex.statusCode)
        }
    }

    public async getReviewStatus(assessmentID: string, requestUserId: string): Promise<ReviewQuestionInstanceDTO[]> {
        try {
            await this.verifyAssessmentOwnership(assessmentID, requestUserId);

            return await this.questionInstanceRepository.createQueryBuilder('question_instance')
                .where('question_instance.assessment = :id', { id: assessmentID })
                .select([
                    'question_instance.id',
                    'question_instance.selected_answers',
                    'question_instance.to_review',
                    'question_instance.assessment_index'
                ])
                .orderBy('assessment_index', 'ASC')
                .getMany()

        } catch (ex) {
            throw new CustomException(`Question Instance Service error while generating review report: ${ex.message}`, ex.statusCode)
        }
    }

    public async getQuestionInstancePackage(assessmentID: string, questionNumber: number, requestUserId: string): Promise<GetQuestionInstanceDTO> {
        try {
            await this.verifyAssessmentOwnership(assessmentID, requestUserId);

            return await this.questionInstanceRepository.createQueryBuilder('question_instance')
                .leftJoin('question_instance.question', 'question')
                .leftJoin('question.answers', 'answer')
                .where('question_instance.assessment = :id', { id: assessmentID })
                .select([
                    'question_instance.id',
                    'question_instance.correct_answers',
                    'question_instance.selected_answers',
                    'question_instance.assessment_index',
                    'question_instance.to_review',
                    'question.id',
                    'question.body',
                    'answer.id',
                    'answer.body'
                ])
                .orderBy('question_instance.assessment_index', 'ASC')
                .skip(questionNumber)
                .take(1)
                .getOne()

        } catch (ex) {
            throw new CustomException(`Question Instance Service error while generating question payload: ${ex.message}`, ex.statusCode)
        }
    }

    public async createQuestionInstances(
        questions: Question[],
        assessmentID: string,
        manager?: EntityManager
    ): Promise<QuestionInstance[]> {
        try {
            const repo = manager
                ? manager.getRepository(QuestionInstance)
                : this.questionInstanceRepository;

            const answerRepo = manager
                ? manager.getRepository(Answer)
                : this.answerRepository;

            const correctAnswersRaw = await answerRepo
                .createQueryBuilder('a')
                .select('a.question', 'questionId')
                .addSelect('COUNT(a.id)', 'correctCount')
                .where('a.question IN (:...ids)', { ids: questions.map(q => q.id) })
                .andWhere('a.is_correct = :isCorrect', { isCorrect: true })
                .andWhere('a.is_deleted = :isDeleted', { isDeleted: false })
                .groupBy('a.question')
                .getRawMany();

            const correctAnswersMap = new Map(
                correctAnswersRaw.map(r => [r.questionId, Number(r.correctCount)])
            );

            const values = questions.map((q, index) => ({
                question: { id: q.id },
                assessment: { id: assessmentID },
                correct_answers: correctAnswersMap.get(q.id) || 0,
                assessment_index: index
            }));

            await repo
                .createQueryBuilder()
                .insert()
                .into(QuestionInstance)
                .values(values)
                .execute();

            return values as QuestionInstance[];

        } catch (ex) {
            throw new CustomException(
                `Question Instance Service insert error: ${ex.message}`,
                ex.statusCode
            );
        }
    }

    public async mark(instanceID: string, payload: MarkPayloadDTO, requestUserId: string): Promise<string> {
        try {
            let questionInstance: QuestionInstance = await this.questionInstanceRepository.createQueryBuilder('question_instance')
                .leftJoinAndSelect('question_instance.assessment', 'assessment')
                .leftJoinAndSelect('assessment.user', 'user')
                .where('question_instance.id = :id', { id: instanceID })
                .getOne();

            if (!questionInstance || questionInstance.assessment?.user?.id !== requestUserId) {
                throw new CustomException('You do not have access to this question instance.', 403);
            }

            if (payload.selected_answers && !payload.selected_answers.length) payload.selected_answers = null;

            let isCorrect = questionInstance.is_correct;
            if (payload.selected_answers) {
                let correctAnswers = (await this.answersService.getCorrectAnswers(payload.question_id)).map(answer => answer.id);
                isCorrect = payload.selected_answers.split(',').every(id => correctAnswers.includes(id)) && correctAnswers.length === payload.selected_answers.split(',').length;
            }

            await this.questionInstanceRepository.update(instanceID, {
                selected_answers: payload.selected_answers,
                to_review: payload.to_review,
                is_correct: isCorrect,
            });

            return 'Question instance updated.'

        } catch (ex) {
            throw new CustomException(`Question Instance Service mark error: ${ex.message}`, ex.statusCode)
        }
    }
}
