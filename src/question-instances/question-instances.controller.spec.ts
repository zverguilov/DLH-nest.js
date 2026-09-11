import { Test, TestingModule } from '@nestjs/testing';
import { QuestionInstancesController } from './question-instances.controller';
import { QuestionInstancesService } from './question-instances.service';

describe('QuestionInstancesController', () => {
  let controller: QuestionInstancesController;
  let service: any;

  const USER_ID = 'user-uuid';
  const request: any = { user: { id: USER_ID } };

  beforeEach(async () => {
    service = {
      getReviewStatus: jest.fn(),
      getReport: jest.fn(),
      getQuestionInstancePackage: jest.fn(),
      mark: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionInstancesController],
      providers: [{ provide: QuestionInstancesService, useValue: service }],
    }).compile();

    controller = module.get<QuestionInstancesController>(QuestionInstancesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getReviewStatus passes the requester id from the JWT, not the URL', async () => {
    service.getReviewStatus.mockResolvedValue([]);
    await controller.getReviewStatus('assessment-1', request);
    expect(service.getReviewStatus).toHaveBeenCalledWith('assessment-1', USER_ID);
  });

  it('getReport passes the requester id from the JWT', async () => {
    service.getReport.mockResolvedValue({ total: 0, questions: [] });
    await controller.getReport('assessment-1', request);
    expect(service.getReport).toHaveBeenCalledWith('assessment-1', USER_ID);
  });

  it('getQuestionInstancePackage passes the requester id from the JWT', async () => {
    service.getQuestionInstancePackage.mockResolvedValue({});
    await controller.getQuestionInstancePackage('assessment-1', 0, request);
    expect(service.getQuestionInstancePackage).toHaveBeenCalledWith('assessment-1', 0, USER_ID);
  });

  it('mark passes the requester id from the JWT alongside the body payload', async () => {
    service.mark.mockResolvedValue('Question instance updated.');
    const payload: any = { question_id: 'q1' };
    await controller.mark('instance-1', payload, request);
    expect(service.mark).toHaveBeenCalledWith('instance-1', payload, USER_ID);
  });
});
