import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from 'src/data/entities/user.entity';
import { Assessment } from 'src/data/entities/assessment.entity';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;
  let assessmentRepository: any;

  beforeEach(async () => {
    userRepository = { findOne: jest.fn(), save: jest.fn(), delete: jest.fn(), count: jest.fn(), createQueryBuilder: jest.fn() };
    assessmentRepository = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Assessment), useValue: assessmentRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setAdminRights', () => {
    it('promotes a user to Admin', async () => {
      const user: any = { id: 'u1', role: 'User' };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.setAdminRights({ id: 'u1', admin: true } as any);

      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ role: 'Admin' }));
      expect(result).toBe('Admin role provided.');
    });

    it('revokes Admin rights back to User', async () => {
      const user: any = { id: 'u1', role: 'Admin' };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.setAdminRights({ id: 'u1', admin: false } as any);

      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ role: 'User' }));
      expect(result).toBe('Admin role revoked.');
    });
  });

  describe('setActive', () => {
    it('activates a locked user when state is true', async () => {
      const user: any = { id: 'u1', state: 'Locked' };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.setActive({ id: 'u1', state: true } as any);

      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ state: 'Active' }));
      expect(result).toBe('User activated.');
    });

    it('locks an active user when state is false', async () => {
      const user: any = { id: 'u1', state: 'Active' };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.setActive({ id: 'u1', state: false } as any);

      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ state: 'Locked' }));
      expect(result).toBe('User deactivated.');
    });
  });

  describe('resetPassword', () => {
    it('hashes the new password before saving (never stores it in plaintext)', async () => {
      const user: any = { id: 'u1' };
      userRepository.findOne.mockResolvedValue(user);

      await service.resetPassword({ id: 'u1', password: 'newplaintextpass' } as any);

      const savedUser = userRepository.save.mock.calls[0][0];
      expect(savedUser.password).not.toBe('newplaintextpass');
      expect(await bcrypt.compare('newplaintextpass', savedUser.password)).toBe(true);
    });
  });

  describe('deleteUser', () => {
    it('throws when the user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteUser('missing')).rejects.toThrow();
      expect(userRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes an existing user', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'u1' });

      const result = await service.deleteUser('u1');

      expect(userRepository.delete).toHaveBeenCalledWith('u1');
      expect(result).toBe('User deleted successfully.');
    });
  });

  describe('getUserByID', () => {
    it('maps a User entity to the public UserGetDTO shape (no password field)', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'u1', email: 'a@b.com', full_name: 'A B', role: 'User', state: 'Active',
      });

      const result = await service.getUserByID('u1');

      expect(result).toEqual({ id: 'u1', email: 'a@b.com', full_name: 'A B', role: 'User', state: 'Active' });
      expect((result as any).password).toBeUndefined();
    });
  });
});
