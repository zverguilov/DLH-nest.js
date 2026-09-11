import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs-extra';
import { LoadController } from './load.controller';
import { LoadService } from './load.service';

jest.mock('fs-extra', () => ({
  ensureDir: jest.fn(),
  writeFile: jest.fn(),
}));

describe('LoadController', () => {
  let controller: LoadController;
  let service: any;

  beforeEach(async () => {
    service = { loadData: jest.fn().mockResolvedValue('ok') };
    (fs.ensureDir as unknown as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as unknown as jest.Mock).mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoadController],
      providers: [{ provide: LoadService, useValue: service }],
    }).compile();

    controller = module.get<LoadController>(LoadController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('strips path traversal sequences from the uploaded filename before writing to disk', async () => {
    const file: any = { originalname: '../../../../etc/cron.d/evil', buffer: Buffer.from('data') };

    await controller.loadData(file);

    const [writtenPath] = (fs.writeFile as unknown as jest.Mock).mock.calls[0];
    expect(writtenPath).not.toContain('..');
    expect(writtenPath.endsWith('evil')).toBe(true);
  });

  it('strips unsafe characters from the filename, keeping only alphanumerics/dot/dash/underscore', async () => {
    const file: any = { originalname: 'exam dump (final)! .xlsx', buffer: Buffer.from('data') };

    await controller.loadData(file);

    const [writtenPath] = (fs.writeFile as unknown as jest.Mock).mock.calls[0];
    const writtenFilename = writtenPath.split('/').pop();
    expect(writtenFilename).toMatch(/^[a-zA-Z0-9._-]+$/);
  });

  it('passes the raw file buffer to LoadService regardless of the sanitized on-disk name', async () => {
    const buffer = Buffer.from('xlsx-bytes');
    const file: any = { originalname: '../evil.xlsx', buffer };

    await controller.loadData(file);

    expect(service.loadData).toHaveBeenCalledWith(buffer);
  });
});
