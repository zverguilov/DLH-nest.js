import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  bootApp, login, authHeader, ensureTestCategory, buildQuestionsXlsx,
  TEST_CATEGORY_NAME, TEST_ADMIN, TEST_USER,
} from './support/e2e-setup';

describe('Comments/Flag, Answers, Assignments (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let adminId: string;
  let userToken: string;
  const createdQuestionIds: string[] = [];

  beforeAll(async () => {
    app = await bootApp();
    const admin = await login(app, TEST_ADMIN.email, TEST_ADMIN.password);
    adminToken = admin.token;
    adminId = admin.id;
    userToken = (await login(app, TEST_USER.email, TEST_USER.password)).token;
    await ensureTestCategory(app, adminToken);

    const marker = Date.now();
    const xlsx = await buildQuestionsXlsx(TEST_CATEGORY_NAME, [
      { body: `E2E Flag Q1 ${marker}`, answers: ['One', 'Two'], correctIndex: 0 },
    ]);
    await request(app.getHttpServer())
      .post('/api/v1/load/data')
      .set(authHeader(adminToken))
      .attach('file', xlsx, 'e2e-flag-question.xlsx')
      .expect(201);

    const found = await request(app.getHttpServer())
      .get(`/api/v1/question?category=${encodeURIComponent(TEST_CATEGORY_NAME)}&search=${encodeURIComponent(String(marker))}`)
      .set(authHeader(adminToken))
      .expect(200);
    expect(found.body.length).toBe(1);
    createdQuestionIds.push(found.body[0].id);
  });

  afterAll(async () => {
    for (const id of createdQuestionIds) {
      await request(app.getHttpServer()).delete(`/api/v1/question/${id}`).set(authHeader(adminToken));
    }
    await app.close();
  });

  describe('PUT /flag - comment/flag spoofing guard', () => {
    it('attributes the comment to the real JWT user, ignoring a forged user_id in the payload', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/flag')
        .set(authHeader(userToken)) // authenticated as test-user
        .send({
          question_id: createdQuestionIds[0],
          user_id: adminId, // forged: claims to be test-admin
          content: 'This question looks wrong (e2e spoofing check)',
        })
        .expect(200);

      expect(res.body.content).toBe('This question looks wrong (e2e spoofing check)');

      const flagged = await request(app.getHttpServer())
        .get('/api/v1/question/flagged')
        .set(authHeader(adminToken))
        .expect(200);
      const ourQuestion = flagged.body.find((q: any) => q.id === createdQuestionIds[0]);
      expect(ourQuestion).toBeDefined();
      const ourComment = ourQuestion.comments.find((c: any) => c.content === 'This question looks wrong (e2e spoofing check)');
      expect(ourComment.user.full_name).toBe('E2E Test User'); // real author, not the forged admin
    });
  });

  describe('PUT /answer (Admin-only)', () => {
    it('rejects a non-admin caller', async () => {
      const question = await request(app.getHttpServer())
        .get(`/api/v1/question/${createdQuestionIds[0]}`)
        .set(authHeader(adminToken))
        .expect(200);
      const answer = question.body.answers[0];

      await request(app.getHttpServer())
        .put('/api/v1/answer')
        .set(authHeader(userToken))
        .send({ id: answer.id, body: answer.body, is_correct: answer.is_correct })
        .expect(403);
    });

    it('actually updates the answer body for an admin', async () => {
      const question = await request(app.getHttpServer())
        .get(`/api/v1/question/${createdQuestionIds[0]}`)
        .set(authHeader(adminToken))
        .expect(200);
      const answer = question.body.answers[0];

      await request(app.getHttpServer())
        .put('/api/v1/answer')
        .set(authHeader(adminToken))
        .send({ id: answer.id, body: 'Updated Answer Text', is_correct: true })
        .expect(200);

      const after = await request(app.getHttpServer())
        .get(`/api/v1/question/${createdQuestionIds[0]}`)
        .set(authHeader(adminToken))
        .expect(200);
      expect(after.body.answers.find((a: any) => a.id === answer.id).body).toBe('Updated Answer Text');
    });
  });

  describe('GET /assignments (Admin-only, maintenance endpoint)', () => {
    it('rejects a non-admin caller and returns a paginated shape for an admin', async () => {
      await request(app.getHttpServer()).get('/api/v1/assignments').set(authHeader(userToken)).expect(403);

      const res = await request(app.getHttpServer())
        .get('/api/v1/assignments')
        .set(authHeader(adminToken))
        .expect(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('nextCursor');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
