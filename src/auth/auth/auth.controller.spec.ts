import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: any;

  beforeEach(async () => {
    service = { login: jest.fn(), reg: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login delegates to AuthService.login with the request body', async () => {
    service.login.mockResolvedValue({ id: 'u1', authToken: 'jwt' });
    const dto: any = { email: 'a@b.com', password: 'pw' };

    const result = await controller.login(dto);

    expect(service.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 'u1', authToken: 'jwt' });
  });

  it('reg delegates to AuthService.reg with the request body', async () => {
    service.reg.mockResolvedValue({ id: 'u1', full_name: 'A' });
    const dto: any = { email: 'a@b.com', full_name: 'A', password: 'pw' };

    const result = await controller.reg(dto);

    expect(service.reg).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 'u1', full_name: 'A' });
  });
});
