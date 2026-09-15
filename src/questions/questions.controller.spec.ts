import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

describe('QuestionsController', () => {
  let controller: QuestionsController;
  let service: any;

  beforeEach(async () => {
    service = {
      getAllQuestions: jest.fn(),
      getErrorPercentageBycategory: jest.fn(),
      getMostFrequentlyWrongQuestions: jest.fn(),
      getFlaggedQuestions: jest.fn(),
      updateQuestion: jest.fn(),
      getQuestionPreview: jest.fn(),
      getQuestionByID: jest.fn(),
      deleteQuestion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [{ provide: QuestionsService, useValue: service }],
    }).compile();

    controller = module.get<QuestionsController>(QuestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getAllQuestions forwards the destructured query params to the service', async () => {
    service.getAllQuestions.mockResolvedValue([]);
    await controller.getAllQuestions({ category: 'CSA', limit: 10, cursorId: 'c1', search: 'foo' } as any);
    expect(service.getAllQuestions).toHaveBeenCalledWith('CSA', 10, 'c1', 'foo', undefined, undefined);
  });

  it('getAllQuestions forwards excludeCategory and flagged through to the service', async () => {
    service.getAllQuestions.mockResolvedValue([]);
    await controller.getAllQuestions({ excludeCategory: 'HR', flagged: false } as any);
    expect(service.getAllQuestions).toHaveBeenCalledWith(undefined, undefined, undefined, undefined, 'HR', false);
  });

  it('updateQuestion delegates to the service with the body payload and the requester id from the JWT', async () => {
    service.updateQuestion.mockResolvedValue('Updated successfully.');
    const payload: any = { id: 'q1', body: 'new body' };
    const request: any = { user: { id: 'admin-uuid' } };
    const result = await controller.updateQuestion(payload, request);
    expect(service.updateQuestion).toHaveBeenCalledWith(payload, 'admin-uuid');
    expect(result).toBe('Updated successfully.');
  });

  it('deleteQuestion delegates to the service with the questionID param', async () => {
    service.deleteQuestion.mockResolvedValue('Question deleted');
    await controller.deleteQuestion('q1');
    expect(service.deleteQuestion).toHaveBeenCalledWith('q1');
  });
});
