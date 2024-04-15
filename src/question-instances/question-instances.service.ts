import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AnswersService } from 'src/answers/answers.service';
import { Question } from 'src/data/entities/question.entity';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { MarkPayloadDTO } from 'src/models/others/mark-payload.dto';
import { Repository } from 'typeorm';

@Injectable()
export class QuestionInstancesService {
    public constructor(
        @InjectRepository(QuestionInstance) private readonly questionInstanceRepository: Repository<QuestionInstance>,
        private readonly answersService: AnswersService
    ) { }

    public async createQuestionInstances(questions: Question[], assessmentID: string): Promise<QuestionInstance[]> {
        try {
            let questionInstances = [];

            for (let question of questions) {
                let newQuestionInstance = await this.questionInstanceRepository.createQueryBuilder()
                    .insert()
                    .into('question_instance')
                    .values({
                        question: question.id,
                        assessment: assessmentID
                    })
                    .execute()

                questionInstances.push(newQuestionInstance);
            }

            return questionInstances;

        } catch (ex) {
            throw `Question Instance Service insert error: ${ex.message}`
        }
    }

    public async mark(instanceID: string, payload: MarkPayloadDTO): Promise<string> {
        try {
            let questionInstance = await this.questionInstanceRepository.createQueryBuilder('question_instance')
                .where('question_instance.id = :id', { id: instanceID })
                .getOne();

            let correctAnswers = (await this.answersService.getCorrectAnswers(payload.questionID)).map(answer => answer.id);
            let allCorrect = payload.selectedAnswers.every(id => correctAnswers.includes(id)) && correctAnswers.length === payload.selectedAnswers.length;

            questionInstance.is_correct = allCorrect;
            await this.questionInstanceRepository.save(questionInstance);

            return allCorrect ? 'Correct!' : 'Incorrect!'

        } catch (ex) {
            throw `Question Instance Service mark error: ${ex.message}`
        }
    }
}
