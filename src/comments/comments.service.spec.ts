import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { Comment } from 'src/data/entities/comment.entity';
import { QuestionsService } from 'src/questions/questions.service';
import { createMockQueryBuilder } from 'src/test-utils/mock-query-builder';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepository: any;
  let questionsService: any;

  beforeEach(async () => {
    commentRepository = { createQueryBuilder: jest.fn() };
    questionsService = { flagQuestion: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: commentRepository },
        { provide: QuestionsService, useValue: questionsService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('uses the requestUserId parameter as the comment author, ignoring any user_id on the payload', async () => {
    const qb = createMockQueryBuilder();
    qb.execute.mockResolvedValue({ identifiers: [{ id: 'c1', content: 'flagged content' }] });
    commentRepository.createQueryBuilder.mockReturnValue(qb);

    const payload: any = { question_id: 'q1', user_id: 'spoofed-id', content: 'flagged content' };
    await service.flag(payload, 'real-requester-id');

    expect(qb.values).toHaveBeenCalledWith({
      question: 'q1',
      user: 'real-requester-id',
      content: 'flagged content',
    });
  });

  it('flags the underlying question after creating the comment', async () => {
    const qb = createMockQueryBuilder();
    qb.execute.mockResolvedValue({ identifiers: [{ id: 'c1', content: 'flagged content' }] });
    commentRepository.createQueryBuilder.mockReturnValue(qb);

    await service.flag({ question_id: 'q1', content: 'flagged content' } as any, 'u1');

    expect(questionsService.flagQuestion).toHaveBeenCalledWith('q1');
  });
});
