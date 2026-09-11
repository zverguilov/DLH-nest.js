import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from 'src/data/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from 'src/config/config.service';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { createMockQueryBuilder } from 'src/test-utils/mock-query-builder';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: any;
  let jwtService: any;
  let usersService: any;

  beforeEach(async () => {
    usersRepository = { createQueryBuilder: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-jwt') };
    usersService = { getAllUsers: jest.fn(), retrieveUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
        { provide: ConfigService, useValue: { jwtSecret: 'test-secret' } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('explicitly selects the password column (regression guard for User.password being select: false)', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      const qb = createMockQueryBuilder();
      qb.getOne.mockResolvedValue({ id: 'u1', email: 'a@b.com', role: 'User', state: 'Active', password: hash });
      usersRepository.createQueryBuilder.mockReturnValue(qb);

      await service.login({ email: 'a@b.com', password: 'correct-password' } as any);

      expect(qb.addSelect).toHaveBeenCalledWith('user.password');
    });

    it('rejects an unknown email', async () => {
      const qb = createMockQueryBuilder();
      qb.getOne.mockResolvedValue(null);
      usersRepository.createQueryBuilder.mockReturnValue(qb);

      await expect(service.login({ email: 'nobody@b.com', password: 'anything' } as any)).rejects.toThrow(CustomException);
    });

    it('rejects an incorrect password', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      const qb = createMockQueryBuilder();
      qb.getOne.mockResolvedValue({ id: 'u1', email: 'a@b.com', role: 'User', state: 'Active', password: hash });
      usersRepository.createQueryBuilder.mockReturnValue(qb);

      await expect(service.login({ email: 'a@b.com', password: 'wrong-password' } as any)).rejects.toThrow(CustomException);
    });

    it('returns an id and signed JWT on successful login', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      const qb = createMockQueryBuilder();
      qb.getOne.mockResolvedValue({ id: 'u1', email: 'a@b.com', role: 'User', state: 'Active', password: hash });
      usersRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.login({ email: 'a@b.com', password: 'correct-password' } as any);

      expect(result).toEqual({ id: 'u1', authToken: 'signed-jwt' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({ id: 'u1', email: 'a@b.com', role: 'User', state: 'Active' });
    });
  });

  describe('reg', () => {
    it('rejects registration when the email is already in use', async () => {
      usersRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.reg({ email: 'a@b.com', full_name: 'A', password: 'pw' } as any)).rejects.toThrow(CustomException);
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('promotes the first registered user to Admin/Active', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      usersRepository.create.mockReturnValue({});
      usersService.getAllUsers.mockResolvedValue([]);

      await service.reg({ email: 'first@b.com', full_name: 'First User', password: 'pw' } as any);

      const savedUser = usersRepository.save.mock.calls[0][0];
      expect(savedUser.role).toBe('Admin');
      expect(savedUser.state).toBe('Active');
    });

    it('does not grant Admin/Active to a subsequent registrant', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      usersRepository.create.mockReturnValue({});
      usersService.getAllUsers.mockResolvedValue([{ id: 'existing-user' }]);

      await service.reg({ email: 'second@b.com', full_name: 'Second User', password: 'pw' } as any);

      const savedUser = usersRepository.save.mock.calls[0][0];
      expect(savedUser.role).toBeUndefined();
      expect(savedUser.state).toBeUndefined();
    });

    it('hashes the password before saving', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      usersRepository.create.mockReturnValue({});
      usersService.getAllUsers.mockResolvedValue([{ id: 'existing-user' }]);

      await service.reg({ email: 'second@b.com', full_name: 'Second User', password: 'plaintext' } as any);

      const savedUser = usersRepository.save.mock.calls[0][0];
      expect(savedUser.password).not.toBe('plaintext');
      expect(await bcrypt.compare('plaintext', savedUser.password)).toBe(true);
    });
  });
});
