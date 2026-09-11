import { Test, TestingModule } from '@nestjs/testing';
import { AnswersController } from './answers.controller';
import { AnswersService } from './answers.service';

describe('AnswersController', () => {
  let controller: AnswersController;
  let service: any;

  beforeEach(async () => {
    service = { updateAnswer: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnswersController],
      providers: [{ provide: AnswersService, useValue: service }],
    }).compile();

    controller = module.get<AnswersController>(AnswersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('updateAnswer delegates to the service with the body payload', async () => {
    service.updateAnswer.mockResolvedValue('Updated successfully.');
    const payload: any = { id: 'a1', body: 'new body', is_correct: true };

    const result = await controller.updateAnswer(payload);

    expect(service.updateAnswer).toHaveBeenCalledWith(payload);
    expect(result).toBe('Updated successfully.');
  });
});
