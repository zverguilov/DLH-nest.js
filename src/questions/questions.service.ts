import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from 'src/data/entities/question.entity';
import { FlagQuestionDTO } from 'src/models/question/flag-question.dto';
import { UpdateQuestionDTO } from 'src/models/question/update-question.dto';
import { Repository } from 'typeorm';

@Injectable()
export class QuestionsService {
    public constructor(
        @InjectRepository(Question) private readonly questionRepository: Repository<Question>,
    ) { }

    public async getRandomBatch(category: string): Promise<Question[]> {
        try {
            let randomQuestions: Question[] = await this.questionRepository.createQueryBuilder('question')
                .leftJoinAndSelect('question.answers', 'answer')
                .where('question.category = :category', { category: category })
                .andWhere('question.is_deleted = :is_deleted', { is_deleted: false })
                .select(['question.id', 'question.body', 'answer.id', 'answer.body'])
                .orderBy('RAND()')
                .take(60)
                .getMany()

            return randomQuestions;

        } catch (ex) {
            throw `Question Service mass retrieval error: ${ex.message}`
        }
    }

    public async getQuestionByID(id: string): Promise<Question> {
        try {
            return await this.questionRepository.findOne({ where: { id } });
        } catch (ex) {
            throw `Question Service single retrieval error: ${ex.message}`
        }
    }

    public async flagQuestion(id: string): Promise<string> {
        try {
            let question:Question = await this.getQuestionByID(id);

            if (!question.is_flagged) question.is_flagged = true;
            await this.questionRepository.save(question);

            return "Question flagged"

        } catch (ex) {
            throw `Question Service flag error: ${ex.message}`
        }
    }

    public async updateQuestion(questionInfo: UpdateQuestionDTO): Promise<string> {
        let question: Question = await this.getQuestionByID(questionInfo.id);        
        await this.questionRepository.update(questionInfo.id, { ...question, ...questionInfo });

        return 'Updated successfully.'
    }
}
