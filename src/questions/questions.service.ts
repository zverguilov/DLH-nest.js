import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from 'src/data/entities/question.entity';
import { Repository } from 'typeorm';

@Injectable()
export class QuestionsService {
    public constructor(
        @InjectRepository(Question) private readonly questionRepository: Repository<Question>,
    ) { }

    public async getRandomBatch(category: string): Promise<Question[]> {
        let randomQuestions = await this.questionRepository.createQueryBuilder('question')
            .leftJoinAndSelect('question.answers', 'answer')
            .where('question.category = :category', { category: category })
            .select(['question.id', 'question.body', 'answer.id', 'answer.body'])
            .orderBy('RAND()')
            .take(60)
            .getMany()

        return randomQuestions;
    }
}
