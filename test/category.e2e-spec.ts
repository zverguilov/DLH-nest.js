import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootApp, login, authHeader, ensureTestCategory, TEST_CATEGORY_NAME, TEST_ADMIN, TEST_USER } from './support/e2e-setup';

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
});
