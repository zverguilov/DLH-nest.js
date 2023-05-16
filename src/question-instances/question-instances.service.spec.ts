import { Test, TestingModule } from '@nestjs/testing';
import { QuestionInstancesService } from './question-instances.service';

describe('QuestionInstancesService', () => {
  let service: QuestionInstancesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionInstancesService],
    }).compile();

    service = module.get<QuestionInstancesService>(QuestionInstancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
