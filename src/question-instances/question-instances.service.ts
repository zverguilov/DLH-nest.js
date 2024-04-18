import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AnswersService } from 'src/answers/answers.service';
import { Question } from 'src/data/entities/question.entity';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { MarkPayloadDTO } from 'src/models/others/mark-payload.dto';
import { GetQuestionInstanceDTO } from 'src/models/question-instance/get-question-instance.dto';
import { Repository } from 'typeorm';

@Injectable()
export class QuestionInstancesService {
    public constructor(
        @InjectRepository(QuestionInstance) private readonly questionInstanceRepository: Repository<QuestionInstance>,
        private readonly answersService: AnswersService,
    ) { }

    public async getQuestionInstancePackage(assessmentID: string, questionNumber: number): Promise<GetQuestionInstanceDTO> {
        try {
            let questionInstance: GetQuestionInstanceDTO = await this.questionInstanceRepository.createQueryBuilder('question_instance')
                .leftJoin('question_instance.question', 'question')
                .leftJoin('question.answers', 'answer')
                .where('question_instance.assessment = :id', { id: assessmentID })
                .select([
                    'question_instance.id',
                    'question_instance.correct_answers',
                    'question.id',
                    'question.body',
                    'answer.id',
                    'answer.body'
                ])
                .orderBy('question_instance.id', 'ASC')
                .skip(questionNumber)
                .take(1)
                .getOne()

            return questionInstance;

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
                        correct_answers: correctAnswers
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
            let questionInstance = await this.questionInstanceRepository.createQueryBuilder('question_instance')
                .where('question_instance.id = :id', { id: instanceID })
                .getOne();

            let correctAnswers = (await this.answersService.getCorrectAnswers(payload.questionInstanceID)).map(answer => answer.id);
            let allCorrect = payload.selectedAnswers.every(id => correctAnswers.includes(id)) && correctAnswers.length === payload.selectedAnswers.length;

            questionInstance.is_correct = allCorrect;
            await this.questionInstanceRepository.save(questionInstance);

            return allCorrect ? 'Correct!' : 'Incorrect!'

        } catch (ex) {
            throw new CustomException(`Question Instance Service mark error: ${ex.message}`, ex.statusCode)
        }
    }
}
