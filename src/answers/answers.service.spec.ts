import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnswersService } from './answers.service';
import { Answer } from 'src/data/entities/answer.entity';
import { createMockQueryBuilder } from 'src/test-utils/mock-query-builder';

describe('AnswersService', () => {
  let service: AnswersService;
  let answerRepository: any;

  beforeEach(async () => {
    answerRepository = { createQueryBuilder: jest.fn(), findOne: jest.fn(), update: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswersService,
        { provide: getRepositoryToken(Answer), useValue: answerRepository },
      ],
    }).compile();

    service = module.get<AnswersService>(AnswersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCorrectAnswers', () => {
    it('only returns non-deleted, correct answers for the given question', async () => {
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([{ id: 'a1' }]);
      answerRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getCorrectAnswers('q1');

      expect(qb.where).toHaveBeenCalledWith('answer.question = :qID', { qID: 'q1' });
      expect(qb.andWhere).toHaveBeenCalledWith('answer.is_correct = :correct', { correct: true });
      expect(qb.andWhere).toHaveBeenCalledWith('answer.is_deleted = :is_deleted', { is_deleted: false });
      expect(result).toEqual([{ id: 'a1' }]);
    });
  });

  describe('updateAnswer', () => {
    it('merges the update payload onto the existing answer', async () => {
      answerRepository.findOne.mockResolvedValue({ id: 'a1', body: 'old body', is_correct: false });

      const result = await service.updateAnswer({ id: 'a1', body: 'new body', is_correct: true } as any);

      expect(answerRepository.update).toHaveBeenCalledWith('a1', expect.objectContaining({ body: 'new body', is_correct: true }));
      expect(result).toBe('Updated successfully.');
    });
  });
});
