import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { QuestionsService } from './questions.service';
import { Question } from 'src/data/entities/question.entity';
import { Category } from 'src/data/entities/category.entity';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { Answer } from 'src/data/entities/answer.entity';
import { Comment } from 'src/data/entities/comment.entity';
import { ASSESSMENT_QUESTIONS } from 'src/constants';
import { createMockQueryBuilder } from 'src/test-utils/mock-query-builder';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let questionRepository: any;
  let categoryRepository: any;
  let questionInstanceRepository: any;
  let dataSource: any;

  beforeEach(async () => {
    questionRepository = {
      createQueryBuilder: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      countBy: jest.fn(),
    };
    categoryRepository = { createQueryBuilder: jest.fn() };
    questionInstanceRepository = { createQueryBuilder: jest.fn() };
    dataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(Question), useValue: questionRepository },
        { provide: getRepositoryToken(Category), useValue: categoryRepository },
        { provide: getRepositoryToken(QuestionInstance), useValue: questionInstanceRepository },
        { provide: getRepositoryToken(Answer), useValue: {} },
        { provide: getRepositoryToken(Comment), useValue: {} },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getErrorPercentageBycategory', () => {
    it('converts the raw fraction to a percentage', async () => {
      const qb = createMockQueryBuilder();
      qb.getRawMany.mockResolvedValue([
        { question_category: 'CSA', error_percentage: '0.25', total_instances: '40' },
      ]);
      questionRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getErrorPercentageBycategory();

      expect(result).toEqual([{ name: 'CSA', error_percentage: 25, total_instances: 40 }]);
    });
  });

  describe('getMostFrequentlyWrongQuestions', () => {
    it('computes errorRate from wrongCount/totalCount, defaulting to 0 with no attempts', async () => {
      const qb = createMockQueryBuilder();
      qb.getRawMany.mockResolvedValue([
        { id: 'q1', body: 'Q1', category: 'CSA', wrongCount: '5', totalCount: '20', bayesianError: '0.3' },
        { id: 'q2', body: 'Q2', category: 'CSA', wrongCount: '0', totalCount: '0', bayesianError: '0.1' },
      ]);
      questionInstanceRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getMostFrequentlyWrongQuestions();

      expect(result[0]).toEqual(expect.objectContaining({ id: 'q1', errorRate: 0.25 }));
      expect(result[1]).toEqual(expect.objectContaining({ id: 'q2', errorRate: 0 }));
    });
  });

  describe('getAllQuestions', () => {
    it('filters by category when a real category name is given', async () => {
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      questionRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getAllQuestions('CSA');

      expect(qb.andWhere).toHaveBeenCalledWith('question.category = :category', { category: 'CSA' });
    });

    it('does not filter by category for the "All" sentinel', async () => {
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      questionRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getAllQuestions('All');

      expect(qb.andWhere).not.toHaveBeenCalledWith('question.category = :category', { category: 'All' });
    });

    it('filters to flagged questions for the "Flagged" sentinel', async () => {
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      questionRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getAllQuestions('Flagged');

      expect(qb.andWhere).toHaveBeenCalledWith('question.is_flagged = true');
    });

    it('applies a case-insensitive search filter', async () => {
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      questionRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getAllQuestions(undefined, undefined, undefined, 'Salesforce');

      expect(qb.andWhere).toHaveBeenCalledWith('LOWER(question.body) LIKE :search', { search: '%salesforce%' });
    });
  });

  describe('getRandomBatch', () => {
    it('uses the category\'s configured question count when set', async () => {
      const categoryQb = createMockQueryBuilder();
      categoryQb.getOne.mockResolvedValue({ number_of_questions: 40 });
      const questionQb = createMockQueryBuilder();
      questionQb.getMany.mockResolvedValue([]);
      categoryRepository.createQueryBuilder.mockReturnValue(categoryQb);
      questionRepository.createQueryBuilder.mockReturnValue(questionQb);

      await service.getRandomBatch('CSA');

      expect(questionQb.take).toHaveBeenCalledWith(40);
    });

    it('falls back to the default ASSESSMENT_QUESTIONS count when the category is not found', async () => {
      const categoryQb = createMockQueryBuilder();
      categoryQb.getOne.mockResolvedValue(null);
      const questionQb = createMockQueryBuilder();
      questionQb.getMany.mockResolvedValue([]);
      categoryRepository.createQueryBuilder.mockReturnValue(categoryQb);
      questionRepository.createQueryBuilder.mockReturnValue(questionQb);

      await service.getRandomBatch('Unknown');

      expect(questionQb.take).toHaveBeenCalledWith(ASSESSMENT_QUESTIONS);
    });
  });

  describe('flagQuestion', () => {
    it('sets is_flagged to true on an unflagged question and saves it', async () => {
      const qb = createMockQueryBuilder();
      qb.getOneOrFail.mockResolvedValue({ id: 'q1', is_flagged: false });
      questionRepository.createQueryBuilder.mockReturnValue(qb);

      await service.flagQuestion('q1');

      expect(questionRepository.save).toHaveBeenCalledWith(expect.objectContaining({ is_flagged: true }));
    });

    it('is a no-op flag-wise (still saves) on an already-flagged question', async () => {
      const qb = createMockQueryBuilder();
      qb.getOneOrFail.mockResolvedValue({ id: 'q1', is_flagged: true });
      questionRepository.createQueryBuilder.mockReturnValue(qb);

      await service.flagQuestion('q1');

      expect(questionRepository.save).toHaveBeenCalledWith(expect.objectContaining({ is_flagged: true }));
    });
  });

  describe('updateQuestion', () => {
    const runTransaction = (manager: any) => {
      dataSource.transaction.mockImplementation(async (cb: any) => cb(manager));
    };

    it('creates new answers, updates existing ones, and deletes the requested answers/comments', async () => {
      const manager = {
        findOneOrFail: jest.fn().mockResolvedValue({ id: 'q1' }),
        save: jest.fn(),
        create: jest.fn((_entity, data) => data),
        update: jest.fn(),
        delete: jest.fn(),
      };
      runTransaction(manager);

      await service.updateQuestion({
        id: 'q1',
        body: 'Updated body',
        category: 'CSA',
        is_flagged: false,
        add_answers: [{ body: 'new answer', is_correct: true } as any],
        update_answers: [{ id: 'a1', body: 'edited', is_correct: false } as any],
        delete_answers: ['a2'],
        delete_comments: ['c1'],
      } as any);

      expect(manager.save).toHaveBeenCalledWith([
        expect.objectContaining({ body: 'new answer', is_correct: true }),
      ]);
      expect(manager.update).toHaveBeenCalledWith(Answer, { id: 'a1' }, { body: 'edited', is_correct: false });
      expect(manager.delete).toHaveBeenCalledWith(Answer, ['a2']);
      expect(manager.delete).toHaveBeenCalledWith(Comment, ['c1']);
      expect(manager.update).toHaveBeenCalledWith(Question, 'q1', {
        body: 'Updated body', is_flagged: false, category: 'CSA',
      });
    });

    it('skips add/update/delete steps entirely when none are provided', async () => {
      const manager = {
        findOneOrFail: jest.fn().mockResolvedValue({ id: 'q1' }),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };
      runTransaction(manager);

      await service.updateQuestion({ id: 'q1', body: 'Just a body edit' } as any);

      expect(manager.save).not.toHaveBeenCalled();
      expect(manager.delete).not.toHaveBeenCalled();
      expect(manager.update).toHaveBeenCalledTimes(1);
      expect(manager.update).toHaveBeenCalledWith(Question, 'q1', {
        body: 'Just a body edit', is_flagged: undefined, category: undefined,
      });
    });
  });

  describe('deleteQuestion', () => {
    it('deletes the question by id', async () => {
      const result = await service.deleteQuestion('q1');
      expect(questionRepository.delete).toHaveBeenCalledWith({ id: 'q1' });
      expect(result).toBe('Question deleted');
    });
  });

  describe('getTotalQuestions', () => {
    it('counts questions by category', async () => {
      questionRepository.countBy.mockResolvedValue(60);
      const result = await service.getTotalQuestions('CSA');
      expect(questionRepository.countBy).toHaveBeenCalledWith({ category: 'CSA' });
      expect(result).toBe(60);
    });
  });

  describe('getDistinctCategoryNames', () => {
    it('returns the distinct category names in use by non-deleted questions', async () => {
      const qb = createMockQueryBuilder();
      qb.getRawMany.mockResolvedValue([{ category: 'CSA' }, { category: 'HR' }]);
      questionRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getDistinctCategoryNames();

      expect(qb.where).toHaveBeenCalledWith('question.is_deleted = false');
      expect(result).toEqual(['CSA', 'HR']);
    });
  });
});
