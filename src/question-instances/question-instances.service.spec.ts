import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuestionInstancesService } from './question-instances.service';
import { QuestionInstance } from 'src/data/entities/question_instance.entity';
import { Answer } from 'src/data/entities/answer.entity';
import { Assessment } from 'src/data/entities/assessment.entity';
import { AnswersService } from 'src/answers/answers.service';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { createMockQueryBuilder, mockCreateQueryBuilderSequence } from 'src/test-utils/mock-query-builder';

describe('QuestionInstancesService', () => {
  let service: QuestionInstancesService;
  let questionInstanceRepository: any;
  let assessmentRepository: any;
  let answersService: any;

  const OWNER_ID = 'owner-uuid';
  const OTHER_ID = 'other-uuid';

  beforeEach(async () => {
    questionInstanceRepository = { createQueryBuilder: jest.fn(), update: jest.fn() };
    assessmentRepository = { findOne: jest.fn() };
    answersService = { getCorrectAnswers: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionInstancesService,
        { provide: getRepositoryToken(QuestionInstance), useValue: questionInstanceRepository },
        { provide: getRepositoryToken(Answer), useValue: {} },
        { provide: getRepositoryToken(Assessment), useValue: assessmentRepository },
        { provide: AnswersService, useValue: answersService },
      ],
    }).compile();

    service = module.get<QuestionInstancesService>(QuestionInstancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ownership checks (getReviewStatus / getReport / getQuestionInstancePackage)', () => {
    it('getReviewStatus rejects when the assessment belongs to a different user', async () => {
      assessmentRepository.findOne.mockResolvedValue({ id: 'a1', user: { id: OTHER_ID } });

      await expect(service.getReviewStatus('a1', OWNER_ID)).rejects.toThrow(CustomException);
      await expect(service.getReviewStatus('a1', OWNER_ID)).rejects.toMatchObject({ statusCode: 403 });
    });

    it('getReviewStatus rejects when the assessment does not exist', async () => {
      assessmentRepository.findOne.mockResolvedValue(null);

      await expect(service.getReviewStatus('missing', OWNER_ID)).rejects.toMatchObject({ statusCode: 403 });
    });

    it('getReviewStatus proceeds and returns data when the assessment belongs to the requester', async () => {
      assessmentRepository.findOne.mockResolvedValue({ id: 'a1', user: { id: OWNER_ID } });
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([{ id: 'qi1' }]);
      questionInstanceRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getReviewStatus('a1', OWNER_ID);

      expect(result).toEqual([{ id: 'qi1' }]);
    });

    it('getQuestionInstancePackage rejects cross-user access', async () => {
      assessmentRepository.findOne.mockResolvedValue({ id: 'a1', user: { id: OTHER_ID } });

      await expect(service.getQuestionInstancePackage('a1', 0, OWNER_ID)).rejects.toMatchObject({ statusCode: 403 });
    });

    it('getReport rejects cross-user access before running any question_instance query', async () => {
      assessmentRepository.findOne.mockResolvedValue({ id: 'a1', user: { id: OTHER_ID } });

      await expect(service.getReport('a1', OWNER_ID)).rejects.toMatchObject({ statusCode: 403 });
      expect(questionInstanceRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('getReport', () => {
    it('returns { total, questions } where total counts all instances and questions is only the wrong ones', async () => {
      assessmentRepository.findOne.mockResolvedValue({ id: 'a1', user: { id: OWNER_ID } });

      const totalQb = createMockQueryBuilder();
      totalQb.getCount.mockResolvedValue(50);

      const wrongQb = createMockQueryBuilder();
      const wrongQuestions = [{ id: 'qi1' }, { id: 'qi2' }];
      wrongQb.getMany.mockResolvedValue(wrongQuestions);

      mockCreateQueryBuilderSequence(questionInstanceRepository, totalQb, wrongQb);

      const result = await service.getReport('a1', OWNER_ID);

      expect(result).toEqual({ total: 50, questions: wrongQuestions });
      expect(wrongQb.andWhere).toHaveBeenCalledWith('question_instance.is_correct = false');
    });
  });

  describe('mark()', () => {
    const buildInstanceQb = (instance: any) => {
      const qb = createMockQueryBuilder();
      qb.getOne.mockResolvedValue(instance);
      return qb;
    };

    it('rejects when the instance does not exist', async () => {
      questionInstanceRepository.createQueryBuilder.mockReturnValue(buildInstanceQb(null));

      await expect(service.mark('missing', { question_id: 'q1' } as any, OWNER_ID))
        .rejects.toMatchObject({ statusCode: 403 });
      expect(questionInstanceRepository.update).not.toHaveBeenCalled();
    });

    it('rejects when the instance belongs to a different user\'s assessment', async () => {
      questionInstanceRepository.createQueryBuilder.mockReturnValue(
        buildInstanceQb({ id: 'qi1', is_correct: false, assessment: { user: { id: OTHER_ID } } }),
      );

      await expect(service.mark('qi1', { question_id: 'q1' } as any, OWNER_ID))
        .rejects.toMatchObject({ statusCode: 403 });
      expect(questionInstanceRepository.update).not.toHaveBeenCalled();
    });

    it('computes is_correct as true when all selected answers are correct and complete', async () => {
      questionInstanceRepository.createQueryBuilder.mockReturnValue(
        buildInstanceQb({ id: 'qi1', is_correct: false, assessment: { user: { id: OWNER_ID } } }),
      );
      answersService.getCorrectAnswers.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);

      await service.mark('qi1', { question_id: 'q1', selected_answers: 'a1,a2' } as any, OWNER_ID);

      expect(questionInstanceRepository.update).toHaveBeenCalledWith('qi1', {
        selected_answers: 'a1,a2',
        to_review: undefined,
        is_correct: true,
      });
    });

    it('computes is_correct as false when a wrong answer is included', async () => {
      questionInstanceRepository.createQueryBuilder.mockReturnValue(
        buildInstanceQb({ id: 'qi1', is_correct: false, assessment: { user: { id: OWNER_ID } } }),
      );
      answersService.getCorrectAnswers.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);

      await service.mark('qi1', { question_id: 'q1', selected_answers: 'a1,wrong-answer' } as any, OWNER_ID);

      expect(questionInstanceRepository.update).toHaveBeenCalledWith('qi1', {
        selected_answers: 'a1,wrong-answer',
        to_review: undefined,
        is_correct: false,
      });
    });

    it('computes is_correct as false when only a subset of correct answers is selected', async () => {
      questionInstanceRepository.createQueryBuilder.mockReturnValue(
        buildInstanceQb({ id: 'qi1', is_correct: false, assessment: { user: { id: OWNER_ID } } }),
      );
      answersService.getCorrectAnswers.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);

      await service.mark('qi1', { question_id: 'q1', selected_answers: 'a1' } as any, OWNER_ID);

      expect(questionInstanceRepository.update).toHaveBeenCalledWith('qi1', {
        selected_answers: 'a1',
        to_review: undefined,
        is_correct: false,
      });
    });

    it('preserves the existing is_correct value when no selected_answers are provided (e.g. a to_review-only update)', async () => {
      questionInstanceRepository.createQueryBuilder.mockReturnValue(
        buildInstanceQb({ id: 'qi1', is_correct: true, assessment: { user: { id: OWNER_ID } } }),
      );

      await service.mark('qi1', { question_id: 'q1', to_review: true } as any, OWNER_ID);

      expect(answersService.getCorrectAnswers).not.toHaveBeenCalled();
      expect(questionInstanceRepository.update).toHaveBeenCalledWith('qi1', {
        selected_answers: undefined,
        to_review: true,
        is_correct: true,
      });
    });

    it('ignores a client-injected is_correct field instead of trusting it (grade-forging regression guard)', async () => {
      questionInstanceRepository.createQueryBuilder.mockReturnValue(
        buildInstanceQb({ id: 'qi1', is_correct: false, assessment: { user: { id: OWNER_ID } } }),
      );
      answersService.getCorrectAnswers.mockResolvedValue([{ id: 'a1' }]);

      // A malicious/malformed payload smuggling is_correct: true alongside a wrong answer.
      const forgedPayload: any = { question_id: 'q1', selected_answers: 'wrong-answer', is_correct: true };

      await service.mark('qi1', forgedPayload, OWNER_ID);

      const [, updatePayload] = questionInstanceRepository.update.mock.calls[0];
      expect(updatePayload.is_correct).toBe(false);
    });
  });
});
