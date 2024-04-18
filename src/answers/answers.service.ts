import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Answer } from 'src/data/entities/answer.entity';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { UpdateAnswerDTO } from 'src/models/answer/update-answer.dto';
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
                .andWhere('answer.is_deleted = :is_deleted', { is_deleted: false })
                .getMany();

            return correctAnswers;

        } catch (ex) {
            throw new CustomEvent(`Answer Service error while collecting records: ${ex.message}`, ex.statusCode);
        }
    }

    public async updateAnswer(answerInfo: UpdateAnswerDTO): Promise<string> {
        try {
            const answer: Answer = await this.answerRepository.findOne({ where: { id: answerInfo.id } });
            await this.answerRepository.update(answerInfo.id, { ...answer, ...answerInfo });

            return 'Updated successfully.';

        } catch (ex) {
            throw new CustomException(`Answer Service error while updating answer: ${ex.message}`, ex.statusCode);
        }
    }
}
