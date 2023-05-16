import { Test, TestingModule } from '@nestjs/testing';
import { QuestionInstancesController } from './question-instances.controller';

describe('QuestionInstancesController', () => {
  let controller: QuestionInstancesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionInstancesController],
    }).compile();

    controller = module.get<QuestionInstancesController>(QuestionInstancesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
