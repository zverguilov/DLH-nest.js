import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as ExcelJS from 'exceljs';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/configure-app';

// Two dedicated, clearly-labeled fixture accounts that already exist in the
// real dev database (created once, out of band, by promoting one of them to
// Admin via an existing admin account). Tests log in fresh each run rather
// than hardcoding tokens. Never use real/personal credentials here.
export const TEST_ADMIN = { email: 'e2e-test-admin@dlh-testing.local', password: 'E2eTestAdmin!2026' };
export const TEST_USER = { email: 'e2e-test-user@dlh-testing.local', password: 'E2eTestUser!2026' };

export async function bootApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication();
  configureApp(app);
  await app.init();
  // Running many spec files back-to-back, each with its own DB connection
  // pool against the shared real dev DB, occasionally leaves a just-opened
  // pool not fully settled for its first query. A brief pause here has
  // measurably eliminated the transient 401s seen on the very first request
  // of a freshly-booted app in the full suite run (never reproducible when
  // a file runs alone) - see also login()'s retry, which is a second layer.
  await new Promise((r) => setTimeout(r, 300));
  return app;
}

/**
 * Running 7 spec files back-to-back each boots its own full app + DB
 * connection pool against the shared real dev DB in a short window. That
 * occasionally causes a transient failure on the very first request right
 * after a fresh boot (observed as an unexpected 401/500, never reproducible
 * running a file in isolation) - connection-pool churn, not an app bug.
 * login() is the one request every spec file's beforeAll depends on, so a
 * single short retry there absorbs that without masking a real auth bug
 * (a genuinely wrong password still fails both attempts).
 */
export async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<{ token: string; id: string }> {
  const attempt = () => request(app.getHttpServer()).post('/api/v1/session/login').send({ email, password });

  let res = await attempt();
  if (res.status !== 201) {
    await new Promise((r) => setTimeout(r, 500));
    res = await attempt();
  }
  if (res.status !== 201) {
    throw new Error(`login(${email}) failed with status ${res.status} after retry: ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.authToken, id: res.body.id };
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

let uniqueCounter = 0;
export function uniqueTestEmail(prefix: string): string {
  uniqueCounter += 1;
  return `${prefix}-${Date.now()}-${uniqueCounter}@dlh-testing.local`;
}

/**
 * Cleanup helper - must not silently leave orphaned throwaway accounts behind
 * if a request transiently fails (see bootApp()'s comment on connection-pool
 * churn), so this retries once and logs (rather than throws, to not mask a
 * real test failure with a cleanup error) if deletion still didn't succeed.
 */
export async function deleteUserAsAdmin(app: INestApplication, adminToken: string, userId: string): Promise<void> {
  const attempt = () => request(app.getHttpServer()).delete(`/api/v1/users/${userId}`).set(authHeader(adminToken));

  let res = await attempt();
  if (res.status !== 200) {
    await new Promise((r) => setTimeout(r, 500));
    res = await attempt();
  }
  if (res.status !== 200) {
    // eslint-disable-next-line no-console
    console.warn(`deleteUserAsAdmin(${userId}) failed with status ${res.status} after retry - orphaned test account, needs manual cleanup.`);
  }
}

export const TEST_CATEGORY_NAME = 'E2E-Test-Category';

/**
 * Category.name is unique in the DB and there's no delete-category endpoint,
 * so tests share one fixed, clearly-labeled category rather than creating a
 * fresh one (and leaking it) on every run. Creates it once if missing.
 */
export async function ensureTestCategory(app: INestApplication, adminToken: string): Promise<{ id: string; name: string }> {
  const existing = await request(app.getHttpServer())
    .get(`/api/v1/category/${TEST_CATEGORY_NAME}`)
    .set(authHeader(adminToken));

  if (existing.status === 200 && existing.body) {
    return existing.body;
  }

  const created = await request(app.getHttpServer())
    .post('/api/v1/category')
    .set(authHeader(adminToken))
    .send({ name: TEST_CATEGORY_NAME, exam_length: 30, number_of_questions: 4, passing_grade: 75 })
    .expect(201);

  return created.body;
}

/**
 * Builds an in-memory xlsx buffer matching the shape LoadService expects:
 * one worksheet named after the category, a skipped header row, then one
 * row per question with columns [id, body, "ans1 / ans2 / ...", "0,1,0...",
 * categoryName].
 */
export async function buildQuestionsXlsx(
  categoryName: string,
  questions: { body: string; answers: string[]; correctIndex: number }[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(categoryName);
  sheet.addRow(['id', 'body', 'answers', 'correctness', 'category']); // header, skipped on import
  questions.forEach((q, i) => {
    const correctness = q.answers.map((_, idx) => (idx === q.correctIndex ? '1' : '0')).join(',');
    sheet.addRow([i + 1, q.body, q.answers.join(' / '), correctness, categoryName]);
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
