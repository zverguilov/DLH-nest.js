import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: any;

  const USER_ID = 'user-uuid';
  const request: any = { user: { id: USER_ID } };

  beforeEach(async () => {
    service = { flag: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [{ provide: CommentsService, useValue: service }],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the requester id from the JWT, not from the request body, as the comment author', async () => {
    service.flag.mockResolvedValue({ id: 'c1', content: 'flagged' });
    // Payload deliberately includes a different user_id, simulating a spoofing attempt -
    // the controller should ignore it and forward the JWT's id instead.
    const payload: any = { question_id: 'q1', user_id: 'someone-elses-id', content: 'flagged' };

    await controller.flag(payload, request);

    expect(service.flag).toHaveBeenCalledWith(payload, USER_ID);
  });
});
