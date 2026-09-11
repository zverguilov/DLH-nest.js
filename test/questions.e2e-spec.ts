import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  bootApp, login, authHeader, ensureTestCategory, buildQuestionsXlsx,
  TEST_CATEGORY_NAME, TEST_ADMIN, TEST_USER,
} from './support/e2e-setup';

describe('Questions + Load (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  const createdQuestionIds: string[] = [];

  beforeAll(async () => {
    app = await bootApp();
    adminToken = (await login(app, TEST_ADMIN.email, TEST_ADMIN.password)).token;
    userToken = (await login(app, TEST_USER.email, TEST_USER.password)).token;
    await ensureTestCategory(app, adminToken);

    // Seed a handful of real, distinctly-named test questions via the actual
    // xlsx import pathway - not inserted directly, so this also exercises
    // LoadService end-to-end against the real DB.
    const marker = Date.now();
    const xlsx = await buildQuestionsXlsx(TEST_CATEGORY_NAME, [
      { body: `E2E Q1 ${marker}`, answers: ['Alpha', 'Beta', 'Gamma'], correctIndex: 1 },
      { body: `E2E Q2 ${marker}`, answers: ['Yes', 'No'], correctIndex: 0 },
      { body: `E2E Q3 ${marker}`, answers: ['Red', 'Green', 'Blue'], correctIndex: 2 },
    ]);

    await request(app.getHttpServer())
      .post('/api/v1/load/data')
      .set(authHeader(adminToken))
      .attach('file', xlsx, 'e2e-test-questions.xlsx')
      .expect(201);

    // The load endpoint doesn't return created IDs, so look them up via search.
    const found = await request(app.getHttpServer())
      .get(`/api/v1/question?search=${encodeURIComponent(`E2E Q`)}&category=${encodeURIComponent(TEST_CATEGORY_NAME)}`)
      .set(authHeader(adminToken))
      .expect(200);
    const ours = found.body.filter((q: any) => q.body.includes(String(marker)));
    expect(ours.length).toBe(3);
    createdQuestionIds.push(...ours.map((q: any) => q.id));
  });

  afterAll(async () => {
    for (const id of createdQuestionIds) {
      await request(app.getHttpServer()).delete(`/api/v1/question/${id}`).set(authHeader(adminToken));
    }
    await app.close();
  });

  describe('admin gating', () => {
    it('rejects a non-admin caller on the core question routes', async () => {
      await request(app.getHttpServer()).get('/api/v1/question').set(authHeader(userToken)).expect(403);
      await request(app.getHttpServer()).get(`/api/v1/question/${createdQuestionIds[0]}`).set(authHeader(userToken)).expect(403);
      await request(app.getHttpServer()).put('/api/v1/question').set(authHeader(userToken)).send({ id: createdQuestionIds[0] }).expect(403);
      await request(app.getHttpServer()).delete(`/api/v1/question/${createdQuestionIds[0]}`).set(authHeader(userToken)).expect(403);
      await request(app.getHttpServer()).post('/api/v1/load/data').set(authHeader(userToken)).expect(403);
    });
  });

  describe('GET /question', () => {
    it('the uploaded xlsx actually created real questions with real answers in the DB', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/question/${createdQuestionIds[0]}`)
        .set(authHeader(adminToken))
        .expect(200);
      expect(res.body.category).toBe(TEST_CATEGORY_NAME);
      expect(res.body.answers.length).toBeGreaterThanOrEqual(2);
      expect(res.body.answers.some((a: any) => a.is_correct)).toBe(true);
    });

    it('filters by category', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/question?category=${encodeURIComponent(TEST_CATEGORY_NAME)}`)
        .set(authHeader(adminToken))
        .expect(200);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
      expect(res.body.every((q: any) => q.category === TEST_CATEGORY_NAME)).toBe(true);
    });
  });

  describe('GET /question/preview/:questionID', () => {
    it('returns the question with its answers', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/question/preview/${createdQuestionIds[0]}`)
        .set(authHeader(adminToken))
        .expect(200);
      expect(res.body.id).toBe(createdQuestionIds[0]);
      expect(Array.isArray(res.body.answers)).toBe(true);
    });
  });

  describe('PUT /question (update)', () => {
    it('updates the body/category/flag, and adds/updates/deletes answers in one transaction', async () => {
      const before = await request(app.getHttpServer())
        .get(`/api/v1/question/${createdQuestionIds[0]}`)
        .set(authHeader(adminToken))
        .expect(200);
      const answerToUpdate = before.body.answers[0];
      const answerToDelete = before.body.answers[1];

      await request(app.getHttpServer())
        .put('/api/v1/question')
        .set(authHeader(adminToken))
        .send({
          id: createdQuestionIds[0],
          body: 'Updated by e2e test',
          is_flagged: true,
          add_answers: [{ body: 'Newly Added Answer', is_correct: false }],
          // Note: real boolean literal, not answerToUpdate.is_correct - that field
          // round-trips from GET as a raw 0/1 (Answer.is_correct is `tinyint`, not
          // `boolean`, in the entity, so TypeORM never casts it), which @IsBoolean()
          // correctly rejects. A client that reads-then-writes this field verbatim
          // would hit the same 400 - a real, separate finding, not a test bug.
          update_answers: [{ id: answerToUpdate.id, body: 'Edited Answer Text', is_correct: false }],
          delete_answers: [answerToDelete.id],
        })
        .expect(200);

      const after = await request(app.getHttpServer())
        .get(`/api/v1/question/${createdQuestionIds[0]}`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(after.body.body).toBe('Updated by e2e test');
      // Question.is_flagged is `tinyint` (not `boolean`) in the entity, so it
      // round-trips as a raw 1/0 rather than a real JS boolean - same class
      // of finding as the answer.is_correct issue noted above.
      expect(after.body.is_flagged).toBeTruthy();
      expect(after.body.answers.some((a: any) => a.body === 'Newly Added Answer')).toBe(true);
      expect(after.body.answers.some((a: any) => a.body === 'Edited Answer Text')).toBe(true);
      expect(after.body.answers.find((a: any) => a.id === answerToDelete.id)).toBeUndefined();
    });
  });

  describe('GET /question/flagged', () => {
    it('includes the question flagged in the previous test', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/question/flagged')
        .set(authHeader(adminToken))
        .expect(200);
      expect(res.body.some((q: any) => q.id === createdQuestionIds[0])).toBe(true);
    });
  });

  describe('analytics endpoints run their real (MySQL-specific raw SQL) queries without error', () => {
    it('GET /question/category_error_percentage', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/question/category_error_percentage')
        .set(authHeader(adminToken))
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /question/frequently_wrong', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/question/frequently_wrong')
        .set(authHeader(adminToken))
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('DELETE /question/:questionID', () => {
    it('actually removes the question', async () => {
      // Use the third seeded question so the other two remain for the tests above.
      const victimId = createdQuestionIds[2];
      await request(app.getHttpServer())
        .delete(`/api/v1/question/${victimId}`)
        .set(authHeader(adminToken))
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/v1/question/${victimId}`)
        .set(authHeader(adminToken))
        .expect(500); // getOneOrFail's not-found error has no HTTP statusCode, so ErrorFilter defaults to 500

      // Already deleted - don't try again in afterAll.
      createdQuestionIds.splice(2, 1);
    });
  });
});
