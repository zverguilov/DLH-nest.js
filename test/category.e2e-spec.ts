import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  bootApp, login, authHeader, ensureTestCategory, buildQuestionsXlsx,
  TEST_CATEGORY_NAME, TEST_ADMIN, TEST_USER,
} from './support/e2e-setup';

// Fixed (not timestamped) name: there's no delete-category endpoint, so a
// name reused across runs avoids leaving a new orphan category behind every
// single time this file runs, the same reasoning as TEST_CATEGORY_NAME.
const ORPHAN_CATEGORY_NAME = 'E2E-Orphan-Test-Category';

describe('Category (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let testCategoryId: string;

  beforeAll(async () => {
    app = await bootApp();
    adminToken = (await login(app, TEST_ADMIN.email, TEST_ADMIN.password)).token;
    userToken = (await login(app, TEST_USER.email, TEST_USER.password)).token;
    const category = await ensureTestCategory(app, adminToken);
    testCategoryId = category.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /category (Admin-only)', () => {
    it('rejects a non-admin caller', async () => {
      await request(app.getHttpServer()).get('/api/v1/category').set(authHeader(userToken)).expect(403);
    });

    it('returns the list of categories including the dedicated test category', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/category').set(authHeader(adminToken)).expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((c: any) => c.name === TEST_CATEGORY_NAME)).toBe(true);
    });
  });

  describe('GET /category/:name', () => {
    it('rejects a non-admin caller', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/category/${TEST_CATEGORY_NAME}`)
        .set(authHeader(userToken))
        .expect(403);
    });

    it('returns the matching category for an admin', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/category/${TEST_CATEGORY_NAME}`)
        .set(authHeader(adminToken))
        .expect(200);
      expect(res.body.id).toBe(testCategoryId);
    });

    it('returns an empty body (200, no JSON) for a name that does not exist', async () => {
      // Real, confirmed behavior: the controller returns null, and Nest sends
      // an empty body rather than a JSON "null" or a 404 - not ideal API
      // design, but this documents actual behavior rather than assuming.
      const res = await request(app.getHttpServer())
        .get('/api/v1/category/Definitely-Not-A-Real-Category-Name')
        .set(authHeader(adminToken))
        .expect(200);
      expect(res.text).toBe('');
    });
  });

  describe('POST /category', () => {
    it('rejects a non-admin caller', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/category')
        .set(authHeader(userToken))
        .send({ name: 'Should-Not-Be-Created' })
        .expect(403);
    });

    it('rejects creating a category with a name that already exists (unique constraint)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/category')
        .set(authHeader(adminToken))
        .send({ name: TEST_CATEGORY_NAME });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PUT /category', () => {
    it('rejects a non-admin caller', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/category')
        .set(authHeader(userToken))
        .send({ id: testCategoryId, passing_grade: 90 })
        .expect(403);
    });

    it('applies a partial update, falling back to existing values for unset fields', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/category')
        .set(authHeader(adminToken))
        .send({ id: testCategoryId, exam_length: 45, number_of_questions: 4, passing_grade: 75 })
        .expect(200);

      // Single-field patch, matching how the real frontend calls this endpoint.
      await request(app.getHttpServer())
        .put('/api/v1/category')
        .set(authHeader(adminToken))
        .send({ id: testCategoryId, passing_grade: 60 })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/category/${TEST_CATEGORY_NAME}`)
        .set(authHeader(adminToken))
        .expect(200);
      expect(res.body.passing_grade).toBe(60);
      expect(res.body.exam_length).toBe(45); // untouched by the second, partial update
      expect(res.body.number_of_questions).toBe(4);

      // Restore to the value the questions/assessments e2e suites expect.
      await request(app.getHttpServer())
        .put('/api/v1/category')
        .set(authHeader(adminToken))
        .send({ id: testCategoryId, passing_grade: 75 })
        .expect(200);
    });
  });

  describe('POST /category/reconcile-missing', () => {
    let orphanQuestionId: string;

    beforeAll(async () => {
      // No direct create-question endpoint exists, so seed one into the
      // normal test category via xlsx, then repoint its category via
      // PUT /question - unlike the xlsx load path, updateQuestion does not
      // auto-create a Category record for the new category value, which is
      // exactly the orphaned state this endpoint is meant to reconcile.
      const marker = Date.now();
      const xlsx = await buildQuestionsXlsx(TEST_CATEGORY_NAME, [
        { body: `E2E Orphan Source Q ${marker}`, answers: ['A', 'B'], correctIndex: 0 },
      ]);
      await request(app.getHttpServer())
        .post('/api/v1/load/data')
        .set(authHeader(adminToken))
        .attach('file', xlsx, 'e2e-orphan-source.xlsx')
        .expect(201);
      const found = await request(app.getHttpServer())
        .get(`/api/v1/question?category=${encodeURIComponent(TEST_CATEGORY_NAME)}&search=${encodeURIComponent(String(marker))}`)
        .set(authHeader(adminToken))
        .expect(200);
      orphanQuestionId = found.body[0].id;

      await request(app.getHttpServer())
        .put('/api/v1/question')
        .set(authHeader(adminToken))
        .send({ id: orphanQuestionId, category: ORPHAN_CATEGORY_NAME })
        .expect(200);
    });

    afterAll(async () => {
      if (orphanQuestionId) {
        await request(app.getHttpServer()).delete(`/api/v1/question/${orphanQuestionId}`).set(authHeader(adminToken));
      }
    });

    it('rejects a non-admin caller', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/category/reconcile-missing')
        .set(authHeader(userToken))
        .expect(403);
    });

    it('creates the missing category with the default settings, and is idempotent on a second call', async () => {
      const first = await request(app.getHttpServer())
        .post('/api/v1/category/reconcile-missing')
        .set(authHeader(adminToken))
        .expect(201);
      // Either this run created it (first time this file ever ran) or an
      // earlier run already did - both are correct, so only assert the
      // list never contains a category that already existed.
      expect(Array.isArray(first.body)).toBe(true);

      const category = await request(app.getHttpServer())
        .get(`/api/v1/category/${ORPHAN_CATEGORY_NAME}`)
        .set(authHeader(adminToken))
        .expect(200);
      expect(category.body.name).toBe(ORPHAN_CATEGORY_NAME);
      expect(category.body.exam_length).toBe(90);
      expect(category.body.number_of_questions).toBe(60);
      expect(category.body.passing_grade).toBe(80);

      // Second call must not error and must not try to recreate it.
      const second = await request(app.getHttpServer())
        .post('/api/v1/category/reconcile-missing')
        .set(authHeader(adminToken))
        .expect(201);
      expect(second.body).not.toContain(ORPHAN_CATEGORY_NAME);
    });

    it('does not include categories that already exist', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/category/reconcile-missing')
        .set(authHeader(adminToken))
        .expect(201);
      expect(res.body).not.toContain(TEST_CATEGORY_NAME);
    });
  });
});
