import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Answer } from 'src/data/entities/answer.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AnswersService {
    public constructor(
        @InjectRepository(Answer) private readonly answerRepository: Repository<Answer>
    ) { }

    public async getCorrectAnswers(questionID: string): Promise<Answer[]> {
        try {
            let correctAnswers = await this.answerRepository.createQueryBuilder('answer')
                .where('answer.question = :qID', { qID: questionID })
                .andWhere('answer.is_correct = :correct', { correct: true })
                .getMany();

            return correctAnswers;

        } catch (ex) {
            throw `Answer Service error while collecting records: ${ex.message}`
        }
    }
}
