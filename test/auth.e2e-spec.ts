import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootApp, login, uniqueTestEmail, deleteUserAsAdmin, TEST_ADMIN, TEST_USER } from './support/e2e-setup';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await bootApp();
    const admin = await login(app, TEST_ADMIN.email, TEST_ADMIN.password);
    adminToken = admin.token;
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      await deleteUserAsAdmin(app, adminToken, id);
    }
    await app.close();
  });

  it('registers a new user successfully', async () => {
    const email = uniqueTestEmail('e2e-reg');
    const res = await request(app.getHttpServer())
      .post('/api/v1/session/reg')
      .send({ email, full_name: 'E2E Reg Test', password: 'RealPassword!2026' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.full_name).toBe('E2E Reg Test');
    createdUserIds.push(res.body.id);
  });

  it('rejects registering a second account with the same email', async () => {
    const email = uniqueTestEmail('e2e-dup');
    const first = await request(app.getHttpServer())
      .post('/api/v1/session/reg')
      .send({ email, full_name: 'First', password: 'RealPassword!2026' })
      .expect(201);
    createdUserIds.push(first.body.id);

    await request(app.getHttpServer())
      .post('/api/v1/session/reg')
      .send({ email, full_name: 'Second', password: 'AnotherPassword!2026' })
      .expect(500); // matches the service's current CustomException(..., 500) on duplicate
  });

  it('rejects registration with a malformed email via the global ValidationPipe', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/session/reg')
      .send({ email: 'not-an-email', full_name: 'Bad Email', password: 'RealPassword!2026' })
      .expect(400);

    expect(res.body.message).toEqual(expect.arrayContaining([expect.stringContaining('email')]));
  });

  it('logs in a real registered user and returns a usable JWT', async () => {
    const email = uniqueTestEmail('e2e-login');
    const reg = await request(app.getHttpServer())
      .post('/api/v1/session/reg')
      .send({ email, full_name: 'Login Test', password: 'RealPassword!2026' })
      .expect(201);
    createdUserIds.push(reg.body.id);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/session/login')
      .send({ email, password: 'RealPassword!2026' })
      .expect(201);

    expect(loginRes.body.authToken).toBeDefined();
    expect(loginRes.body.id).toBe(reg.body.id);

    // The token actually works against a protected route.
    await request(app.getHttpServer())
      .get(`/api/v1/users/${reg.body.id}`)
      .set('Authorization', `Bearer ${loginRes.body.authToken}`)
      .expect(200);
  });

  it('rejects login with the wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/session/login')
      .send({ email: TEST_USER.email, password: 'definitely-wrong' })
      .expect(400);
  });

  it('rejects login for a nonexistent email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/session/login')
      .send({ email: uniqueTestEmail('nonexistent'), password: 'whatever123' })
      .expect(400);
  });

  it('the dedicated test-admin and test-user fixtures log in successfully', async () => {
    const admin = await login(app, TEST_ADMIN.email, TEST_ADMIN.password);
    const user = await login(app, TEST_USER.email, TEST_USER.password);
    expect(admin.token).toBeDefined();
    expect(user.token).toBeDefined();
    expect(admin.id).not.toBe(user.id);
  });
});
