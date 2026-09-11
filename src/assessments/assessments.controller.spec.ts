import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { CustomException } from 'src/middleware/exception/custom-exception';

describe('AssessmentsController', () => {
  let controller: AssessmentsController;
  let service: any;

  const OWNER_ID = 'owner-uuid';
  const OTHER_ID = 'other-uuid';
  const ownerRequest: any = { user: { id: OWNER_ID, role: 'User' } };
  const adminRequest: any = { user: { id: 'admin-uuid', role: 'Admin' } };

  beforeEach(async () => {
    service = {
      getActiveAssessment: jest.fn(),
      getMyAssessments: jest.fn(),
      startAssignedAssessment: jest.fn(),
      submitAssessment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentsController],
      providers: [{ provide: AssessmentsService, useValue: service }],
    }).compile();

    controller = module.get<AssessmentsController>(AssessmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getActiveAssessment (self-only)', () => {
    it('allows a user to view their own ongoing assessment', async () => {
      service.getActiveAssessment.mockResolvedValue({ id: 'a1' });
      await controller.getActiveAssessment(OWNER_ID, ownerRequest);
      expect(service.getActiveAssessment).toHaveBeenCalledWith(OWNER_ID);
    });

    it('rejects a user looking up another user\'s ongoing assessment', async () => {
      await expect(controller.getActiveAssessment(OTHER_ID, ownerRequest)).rejects.toMatchObject({ statusCode: 403 });
      expect(service.getActiveAssessment).not.toHaveBeenCalled();
    });
  });

  describe('getUserAssessments (self-or-Admin)', () => {
    it('allows a user to list their own assessments', async () => {
      service.getMyAssessments.mockResolvedValue([]);
      await controller.getUserAssessments(OWNER_ID, ownerRequest);
      expect(service.getMyAssessments).toHaveBeenCalled();
    });

    it('rejects a non-admin user listing another user\'s assessments', async () => {
      await expect(controller.getUserAssessments(OTHER_ID, ownerRequest)).rejects.toThrow(CustomException);
      expect(service.getMyAssessments).not.toHaveBeenCalled();
    });

    it('allows an Admin to list any user\'s assessments (admin per-user drill-down)', async () => {
      service.getMyAssessments.mockResolvedValue([]);
      await controller.getUserAssessments(OTHER_ID, adminRequest);
      expect(service.getMyAssessments).toHaveBeenCalledWith(OTHER_ID, undefined, undefined, undefined, undefined, undefined);
    });
  });

  describe('startAssignedAssessment / submitAssessment', () => {
    it('startAssignedAssessment forwards the requester id from the JWT to the service', async () => {
      service.startAssignedAssessment.mockResolvedValue({ id: 'a1' });
      await controller.startAssignedAssessment('a1', ownerRequest);
      expect(service.startAssignedAssessment).toHaveBeenCalledWith('a1', OWNER_ID);
    });

    it('submitAssessment forwards the requester id from the JWT to the service', async () => {
      service.submitAssessment.mockResolvedValue({ id: 'a1' });
      await controller.submitAssessment('a1', ownerRequest);
      expect(service.submitAssessment).toHaveBeenCalledWith('a1', OWNER_ID);
    });
  });
});
