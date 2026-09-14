import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CustomException } from 'src/middleware/exception/custom-exception';

describe('UsersController', () => {
  let controller: UsersController;
  let service: any;

  const OWNER_ID = 'owner-uuid';
  const OTHER_ID = 'other-uuid';
  const ownerRequest: any = { user: { id: OWNER_ID, role: 'User' } };
  const adminRequest: any = { user: { id: 'admin-uuid', role: 'Admin' } };

  beforeEach(async () => {
    service = { getUserByID: jest.fn(), getAllUsers: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserByID (self-or-Admin)', () => {
    it('allows a user to view their own profile', async () => {
      service.getUserByID.mockResolvedValue({ id: OWNER_ID });
      await controller.getUserByID(OWNER_ID, ownerRequest);
      expect(service.getUserByID).toHaveBeenCalledWith(OWNER_ID);
    });

    it('rejects a non-admin user looking up another user\'s profile', async () => {
      await expect(controller.getUserByID(OTHER_ID, ownerRequest)).rejects.toThrow(CustomException);
      await expect(controller.getUserByID(OTHER_ID, ownerRequest)).rejects.toMatchObject({ statusCode: 403 });
      expect(service.getUserByID).not.toHaveBeenCalled();
    });

    it('allows an Admin to look up any user\'s profile', async () => {
      service.getUserByID.mockResolvedValue({ id: OTHER_ID });
      await controller.getUserByID(OTHER_ID, adminRequest);
      expect(service.getUserByID).toHaveBeenCalledWith(OTHER_ID);
    });
  });

  describe('getAllUsers', () => {
    it('forwards the role/excludeRole/state/excludeState query params to the service in order', async () => {
      service.getAllUsers.mockResolvedValue([]);

      await controller.getAllUsers('10', 'Jane', 'id1', 'jane', 'Admin', undefined, 'Active', undefined);

      expect(service.getAllUsers).toHaveBeenCalledWith(10, 'Jane', 'id1', 'jane', 'Admin', undefined, 'Active', undefined);
    });

    it('forwards excludeRole/excludeState through untouched', async () => {
      service.getAllUsers.mockResolvedValue([]);

      await controller.getAllUsers(undefined, undefined, undefined, undefined, undefined, 'Admin', undefined, 'Locked');

      expect(service.getAllUsers).toHaveBeenCalledWith(NaN, undefined, undefined, undefined, undefined, 'Admin', undefined, 'Locked');
    });
  });
});
