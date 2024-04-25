import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ASSESSMENT_QUESTIONS } from 'src/constants';
import { Question } from 'src/data/entities/question.entity';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { FlagQuestionDTO } from 'src/models/question/flag-question.dto';
import { ReviewFlaggedQuestionDTO } from 'src/models/question/review-flagged-question.dto';
import { UpdateQuestionDTO } from 'src/models/question/update-question.dto';
import { Repository } from 'typeorm';

@Injectable()
export class QuestionsService {
    public constructor(
        @InjectRepository(Question) private readonly questionRepository: Repository<Question>,
    ) { }

    public async getAllQuestions(category: string): Promise<ReviewFlaggedQuestionDTO[]> {
        try {
            let queryBuilder = this.questionRepository.createQueryBuilder('question')
                .where('question.is_deleted = false')
                .leftJoin('question.answers', 'answer')
                .select([
                    'question.id',
                    'question.body',
                    'question.category',
                    'question.is_flagged',
                    'answer.id',
                    'answer.body',
                    'answer.is_correct',
                ])

            if (category) queryBuilder.andWhere('category = :category', { category });

            return await queryBuilder.getMany();

        } catch (ex) {
            throw new CustomException(`Question Service error while retrieving questions: ${ex.message}`, ex.message);
        }
    }

    public async getFlaggedQuestions(): Promise<ReviewFlaggedQuestionDTO[]> {
        try {
            return await this.questionRepository.createQueryBuilder('question')
                .where('is_flagged = true')
                .leftJoin('question.answers', 'answer')
                .leftJoin('question.comments', 'comment')
                .leftJoin('comment.user', 'user')
                .select([
                    'question.id',
                    'question.body',
                    'question.category',
                    'question.is_flagged',
                    'answer.id',
                    'answer.body',
                    'answer.is_correct',
                    'comment.id',
                    'comment.content',
                    'user.full_name'
                ])
                .getMany()

        } catch (ex) {
            throw new CustomException(`Question Service error while retrieving flagged questions: ${ex.message}`, ex.message);
        }
    }

    public async getRandomBatch(category: string): Promise<Question[]> {
        try {
            let randomQuestions: Question[] = await this.questionRepository.createQueryBuilder('question')
                .leftJoinAndSelect('question.answers', 'answer')
                .where('question.category = :category', { category: category })
                .andWhere('question.is_deleted = :is_deleted', { is_deleted: false })
                .select(['question.id', 'question.body', 'answer.id', 'answer.body'])
                .orderBy('RAND()')
                .take(ASSESSMENT_QUESTIONS)
                .getMany()

            return randomQuestions;

        } catch (ex) {
            throw new CustomException(`Question Service mass retrieval error: ${ex.message}`, ex.message);
        }
    }

    public async getQuestionByID(id: string): Promise<Question> {
        try {
            return await this.questionRepository.findOne({ where: { id } });
        } catch (ex) {
            throw new CustomException(`Question Service single retrieval error: ${ex.message}`, ex.message);
        }
    }

    public async flagQuestion(id: string): Promise<string> {
        try {
            let question: Question = await this.getQuestionByID(id);

            if (!question.is_flagged) question.is_flagged = true;
            await this.questionRepository.save(question);

            return "Question flagged";

        } catch (ex) {
            throw new CustomException(`Question Service flag error: ${ex.message}`, ex.statusCode);
        }
    }

    public async updateQuestion(questionInfo: UpdateQuestionDTO): Promise<string> {
        try {
            let question: Question = await this.getQuestionByID(questionInfo.id);
            await this.questionRepository.update(questionInfo.id, { ...question, ...questionInfo });

            return 'Updated successfully.';

        } catch (ex) {
            throw new CustomException(`Question Service error while updating question: ${ex.message}`, ex.statusCode);
        }
    }
}
