import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from 'src/data/entities/question.entity';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { Repository } from 'typeorm';

@Injectable()
export class QuestionInstancesService {
    public constructor(
        @InjectRepository(QuestionInstance) private readonly questionInstanceRepository: Repository<QuestionInstance>
    ) { }

    public async createQuestionInstances(questions: Question[], assessmentID: string): Promise<QuestionInstance[]> {

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
    }
}
