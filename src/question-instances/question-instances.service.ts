import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AnswersService } from 'src/answers/answers.service';
import { Question } from 'src/data/entities/question.entity';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { MarkPayloadDTO } from 'src/models/others/mark-payload.dto';
import { GetQuestionInstanceDTO } from 'src/models/question-instance/get-question-instance.dto';
import { QuestionInstanceStatusDTO } from 'src/models/question-instance/question-instance-status.dto';
import { ReportQuestionInstanceDTO } from 'src/models/question-instance/report-question-instance.dto';
import { ReviewQuestionInstanceDTO } from 'src/models/question-instance/review-question-instance.dto';
import { Repository } from 'typeorm';

@Injectable()
export class QuestionInstancesService {
    public constructor(
        @InjectRepository(QuestionInstance) private readonly questionInstanceRepository: Repository<QuestionInstance>,
        private readonly answersService: AnswersService,
    ) { }

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

    public async getReport(assessmentID: string): Promise<ReportQuestionInstanceDTO[]> {
        try {
            return await this.questionInstanceRepository.createQueryBuilder('question_instance')
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

        } catch (ex) {
            throw new CustomException(`Question Instance Service error while generating assessment report: ${ex.message}`, ex.statusCode)
        }
    }

    public async getReviewStatus(assessmentID: string): Promise<ReviewQuestionInstanceDTO[]> {
        try {
            return await this.questionInstanceRepository.createQueryBuilder('question_instance')
                .where('question_instance.assessment = :id', { id: assessmentID })
                .select([
                    'question_instance.id',
                    'question_instance.correct_answers',
                    'question_instance.to_review',
                    'question_instance.assessment_index'
                ])
                .orderBy('assessment_index', 'ASC')
                .getMany()

        } catch (ex) {
            throw new CustomException(`Question Instance Service error while generating review report: ${ex.message}`, ex.statusCode)
        }
    }

    public async getQuestionInstancePackage(assessmentID: string, questionNumber: number): Promise<GetQuestionInstanceDTO> {
        try {
            return await this.questionInstanceRepository.createQueryBuilder('question_instance')
                .leftJoin('question_instance.question', 'question')
                .leftJoin('question.answers', 'answer')
                .where('question_instance.assessment = :id', { id: assessmentID })
                .select([
                    'question_instance.id',
                    'question_instance.correct_answers',
                    'question_instance.selected_answers',
                    'question_instance.assessment_index',
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

    public async createQuestionInstances(questions: Question[], assessmentID: string): Promise<QuestionInstance[]> {
        try {
            let questionInstances = [];

            for (let question of questions) {
                let correctAnswers = (await this.answersService.getCorrectAnswers(question.id)).length;
                let newQuestionInstance = await this.questionInstanceRepository.createQueryBuilder()
                    .insert()
                    .into('question_instance')
                    .values({
                        question: question.id,
                        assessment: assessmentID,
                        correct_answers: correctAnswers,
                        assessment_index: questions.indexOf(question)
                    })
                    .execute()

                questionInstances.push(newQuestionInstance);
            }

            return questionInstances;

        } catch (ex) {
            throw new CustomException(`Question Instance Service insert error: ${ex.message}`, ex.statusCode)
        }
    }

    public async mark(instanceID: string, payload: MarkPayloadDTO): Promise<string> {
        try {
            let allCorrect = false;
            let questionInstance: QuestionInstance = await this.questionInstanceRepository.createQueryBuilder('question_instance')
                .where('question_instance.id = :id', { id: instanceID })
                .getOne();

            if (payload.selected_answers && !payload.selected_answers.length) payload.selected_answers = null;

            if (payload.selected_answers) {
                let correctAnswers = (await this.answersService.getCorrectAnswers(payload.question_id)).map(answer => answer.id);
                questionInstance.is_correct = payload.selected_answers.split(',').every(id => correctAnswers.includes(id)) && correctAnswers.length === payload.selected_answers.split(',').length;                
            }
            delete payload.question_id;

            await this.questionInstanceRepository.update(instanceID, { ...questionInstance, ...payload });

            return 'Question instance updated.'

        } catch (ex) {
            throw new CustomException(`Question Instance Service mark error: ${ex.message}`, ex.statusCode)
        }
    }
}
