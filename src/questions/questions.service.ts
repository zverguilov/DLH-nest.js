import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ASSESSMENT_QUESTIONS } from 'src/constants';
import { Answer } from 'src/data/entities/answer.entity';
import { Category } from 'src/data/entities/category.entity';
import { Question } from 'src/data/entities/question.entity';
import { Comment } from 'src/data/entities/comment.entity';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { CreateAnswerDTO } from 'src/models/answer/create-answer.dto';
import { CategoryErrorPercentageDTO } from 'src/models/category/category-error-percentage.dto';
import { MostWrongQuestionDTO } from 'src/models/question-instance/most-wrong-question.dto';
import { QuestionPreviewDTO } from 'src/models/question/question-preview.dto';
import { ReviewFlaggedQuestionDTO } from 'src/models/question/review-flagged-question.dto';
import { UpdateQuestionDTO } from 'src/models/question/update-question.dto';
import { createQueryBuilder, DataSource, Repository } from 'typeorm';

@Injectable()
export class QuestionsService {
  public constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(QuestionInstance)
    private readonly questionInstanceRepository: Repository<QuestionInstance>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>
  ) { }

  public async getErrorPercentageBycategory(): Promise<CategoryErrorPercentageDTO[]> {
    try {
      const categories = await this.questionRepository
        .createQueryBuilder('question')
        .leftJoin('question.instances', 'instance')
        .select([
          'question.category'
        ])
        .groupBy('question.category')
        // .addSelect('COUNT(CASE WHEN instance.is_correct = false THEN 1 END)', 'wrong_count')
        // .addSelect('COUNT(instance.id)', 'total_count')
        .addSelect('COUNT(CASE WHEN instance.is_correct = false THEN 1 END) * 1.0 / COUNT(instance.id)', 'error_percentage')
        .orderBy('COUNT(CASE WHEN instance.is_correct = false THEN 1 END)/COUNT(instance.id)', 'DESC')
        .limit(3)
        .getRawMany()

      console.log(categories)
      return categories
        .map(category => ({
          name: category.question_category,
          error_percentage: category.error_percentage * 100
        }))

    } catch (ex) {
      throw new CustomException(
        `Question Service error while retrieving category error percentages: ${ex.message}`,
        ex.message,
      );
    }
  }

  public async getMostFrequentlyWrongQuestions(): Promise<MostWrongQuestionDTO[]> {
    try {
      const qi = await this.questionInstanceRepository
        .createQueryBuilder('question_instance')
        .where('question_instance.is_correct = false')
        .leftJoin('question_instance.question', 'q')
        .select([
          'q.id',
          'q.body',
          'q.category'
        ])
        .groupBy('q.id')
        .addGroupBy('q.body')
        .addGroupBy('q.category')
        .addSelect('COUNT(question_instance.id)', 'wrongCount')
        .orderBy('wrongCount', 'DESC')
        .limit(10)

      const rawResults = await qi.getRawMany()

      return rawResults.map(r => ({
        id: r.q_id,
        body: r.q_body,
        category: r.q_category,
        wrongCount: +r.wrongCount,
      }));
    } catch (ex) {
      throw new CustomException(
        `Question Service error while retrieving most wrong questions: ${ex.message}`,
        ex.message,
      );
    }
  }


  public async getAllQuestions(
    category?: string,
    limit?: number,
    cursorId?: string,
    search?: string
  ): Promise<ReviewFlaggedQuestionDTO[]> {
    try {
      const qb = this.questionRepository
        .createQueryBuilder('question')
        .leftJoin('question.answers', 'answer')
        .select([
          'question.id',
          'question.body',
          'question.category',
          'question.is_flagged',
          'question.is_deleted',
          'answer.id',
          'answer.body',
          'answer.is_correct',
        ])
        .where('question.is_deleted = false');

      if (category && category !== 'All' && category !== 'Flagged') qb.andWhere('question.category = :category', { category });

      if (category === 'Flagged') qb.andWhere('question.is_flagged = true')

      if (search) qb.andWhere('LOWER(question.body) LIKE :search', { search: `%${search.toLowerCase()}%` });

      if (cursorId) qb.andWhere('question.id > :cursorId', { cursorId });

      if (limit) qb.take(limit);

      qb.orderBy('question.id', 'ASC');

      return await qb.getMany();
    } catch (ex) {
      throw new CustomException(
        `Question Service error while retrieving questions: ${ex.message}`,
        ex.message,
      );
    }
  }


  public async getFlaggedQuestions(): Promise<ReviewFlaggedQuestionDTO[]> {
    try {
      return await this.questionRepository
        .createQueryBuilder('question')
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
          'user.full_name',
        ])
        .getMany();
    } catch (ex) {
      throw new CustomException(
        `Question Service error while retrieving flagged questions: ${ex.message}`,
        ex.message,
      );
    }
  }

  public async getRandomBatch(categoryName: string): Promise<Question[]> {
    try {
      const category: Category = await this.categoryRepository
        .createQueryBuilder('category')
        .where('category.name = :name', { name: categoryName })
        .getOne();

      const randomQuestions: Question[] = await this.questionRepository
        .createQueryBuilder('question')
        .leftJoinAndSelect('question.answers', 'answer')
        .where('question.category = :category', { category: category })
        .andWhere('question.is_deleted = :is_deleted', { is_deleted: false })
        .select(['question.id', 'question.body', 'answer.id', 'answer.body'])
        .orderBy('RAND()')
        .take(category?.number_of_questions || ASSESSMENT_QUESTIONS)
        .getMany();

      return randomQuestions;
    } catch (ex) {
      throw new CustomException(
        `Question Service mass retrieval error: ${ex.message}`,
        ex.message,
      );
    }
  }

  public async getQuestionPreview(id: string): Promise<QuestionPreviewDTO> {
    try {
      const question = this.questionRepository
        .createQueryBuilder('question')
        .where('question.id = :id', { id })
        .leftJoin('question.answers', 'answer')
        .select([
          'question.id',
          'question.body',
          'answer.id',
          'answer.body',
          'answer.is_correct'
        ])

      return await question.getOne();
    } catch (ex) {
      throw new CustomException(
        `Question Service single retrieval error: ${ex.message}`,
        ex.message,
      );
    }
  }

  public async getQuestionByID(id: string): Promise<Question> {
    try {
      return await this.questionRepository
        .createQueryBuilder('question')
        .where('question.id = :id', { id })
        .leftJoinAndSelect('question.answers', 'answers')
        .leftJoinAndSelect('question.comments', 'comments')
        .leftJoinAndSelect('comments.user', 'user')
        .getOneOrFail()
    } catch (ex) {
      throw new CustomException(
        `Question Service single retrieval error: ${ex.message}`,
        ex.message,
      );
    }
  }

  public async flagQuestion(id: string): Promise<string> {
    try {
      const question: Question = await this.getQuestionByID(id);

      if (!question.is_flagged) question.is_flagged = true;
      await this.questionRepository.save(question);

      return 'Question flagged';
    } catch (ex) {
      throw new CustomException(
        `Question Service flag error: ${ex.message}`,
        ex.statusCode,
      );
    }
  }

  public async updateQuestion(
    questionInfo: UpdateQuestionDTO,
  ): Promise<string> {
    try {
      await this.dataSource.transaction(async manager => {
        const question: Question = await manager.findOneOrFail(Question, { where: { id: questionInfo.id } });

        if (questionInfo.add_answers?.length) await manager.save(
          questionInfo.add_answers.map(dto => manager.create(
            Answer,
            {
              body: dto.body,
              is_correct: dto.is_correct,
              question
            }
          ))
        )

        if (questionInfo.update_answers?.length) await Promise.all(
          questionInfo.update_answers.map(dto => manager.update(
            Answer,
            { id: dto.id },
            {
              body: dto.body,
              is_correct: dto.is_correct
            }
          ))
        )

        if (questionInfo.delete_answers?.length) await manager.delete(Answer, questionInfo.delete_answers)

        if (questionInfo.delete_comments?.length) await manager.delete(Comment, questionInfo.delete_comments);

        await manager.update(
          Question,
          questionInfo.id,
          {
            body: questionInfo.body,
            is_flagged: questionInfo.is_flagged,
            category: questionInfo.category
          }
        );
      })

      return 'Updated successfully.';
    } catch (ex) {
      throw new CustomException(
        `Question Service error while updating question: ${ex.message}`,
        ex.statusCode,
      );
    }
  }

  public async deleteQuestion(id: string): Promise<string> {
    try {
      await this.questionRepository.delete({id});

      return "Question deleted"
    } catch (ex) {
      throw new CustomException(
        `Question Service single retrieval error: ${ex.message}`,
        ex.message,
      );
    }
  }

  public async getTotalQuestions(category: string): Promise<number> {
    try {
      return await this.questionRepository.countBy({category});

    } catch (ex) {
      throw new CustomException(
        `Question Service category questions total number error: ${ex.message}`,
        ex.message,
      );
    }
  }
}
