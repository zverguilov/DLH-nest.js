import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

describe('AssignmentsController', () => {
  let controller: AssignmentsController;
  let service: any;

  beforeEach(async () => {
    service = { getAssignments: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [{ provide: AssignmentsService, useValue: service }],
    }).compile();

    controller = module.get<AssignmentsController>(AssignmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('forwards the destructured query params to the service', async () => {
    service.getAssignments.mockResolvedValue({ data: [], nextCursor: null });

    await controller.getAssignments({ category: 'CSA', assignedBy: 'Jane', limit: 10, cursor: 'abc' });

    expect(service.getAssignments).toHaveBeenCalledWith('CSA', 'Jane', 10, 'abc');
  });
});
