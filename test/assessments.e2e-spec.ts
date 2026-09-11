import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  bootApp, login, authHeader, ensureTestCategory, buildQuestionsXlsx, uniqueTestEmail, deleteUserAsAdmin,
  TEST_CATEGORY_NAME, TEST_ADMIN, TEST_USER,
} from './support/e2e-setup';

describe('Assessments + Question-Instances (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let userId: string;
  const createdQuestionIds: string[] = [];
  const createdUserIds: string[] = [];
  // Question body -> correct answer text. getRandomBatch shuffles question
  // order (ORDER BY RAND()), so assessment position can't be assumed to match
  // upload order - always resolve correctness by matching on content instead.
  const correctAnswerTextByBody = new Map<string, string>();

  beforeAll(async () => {
    app = await bootApp();
    const admin = await login(app, TEST_ADMIN.email, TEST_ADMIN.password);
    adminToken = admin.token;
    const user = await login(app, TEST_USER.email, TEST_USER.password);
    userToken = user.token;
    userId = user.id;

    const category = await ensureTestCategory(app, adminToken);
    // Category is configured with number_of_questions=4 (see category.e2e-spec.ts) -
    // seed exactly that many so getRandomBatch pulls a deterministic, known set.
    const marker = Date.now();
    const questionDefs = [
      { body: `E2E Assess Q1 ${marker}`, answers: ['A', 'B'], correctIndex: 0 },
      { body: `E2E Assess Q2 ${marker}`, answers: ['A', 'B'], correctIndex: 1 },
      { body: `E2E Assess Q3 ${marker}`, answers: ['A', 'B'], correctIndex: 0 },
      { body: `E2E Assess Q4 ${marker}`, answers: ['A', 'B'], correctIndex: 1 },
    ];
    for (const q of questionDefs) {
      correctAnswerTextByBody.set(q.body, q.answers[q.correctIndex]);
    }
    const xlsx = await buildQuestionsXlsx(TEST_CATEGORY_NAME, questionDefs);
    await request(app.getHttpServer())
      .post('/api/v1/load/data')
      .set(authHeader(adminToken))
      .attach('file', xlsx, 'e2e-assess-questions.xlsx')
      .expect(201);

    const found = await request(app.getHttpServer())
      .get(`/api/v1/question?category=${encodeURIComponent(TEST_CATEGORY_NAME)}&search=${encodeURIComponent(String(marker))}`)
      .set(authHeader(adminToken))
      .expect(200);
    expect(found.body.length).toBe(4);
    createdQuestionIds.push(...found.body.map((q: any) => q.id));
  });

  afterAll(async () => {
    for (const id of createdQuestionIds) {
      await request(app.getHttpServer()).delete(`/api/v1/question/${id}`).set(authHeader(adminToken));
    }
    for (const id of createdUserIds) {
      await deleteUserAsAdmin(app, adminToken, id);
    }
    await app.close();
  });

  describe('full training-assessment lifecycle for a real user against real data', () => {
    let assessmentId: string;

    it('creates a random training assessment for the caller', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/assessment')
        .set(authHeader(userToken))
        .send({ exam_type: TEST_CATEGORY_NAME, user: userId })
        .expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.exam_type).toBe(TEST_CATEGORY_NAME);
      assessmentId = res.body.id;
    });

    it('rejects starting a second concurrent training assessment for the same user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/assessment')
        .set(authHeader(userToken))
        .send({ exam_type: TEST_CATEGORY_NAME, user: userId });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('GET /assessment/ongoing/:userID enforces self-only access', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/assessment/ongoing/${userId}`)
        .set(authHeader(adminToken)) // admin is not this route's owner and has no bypass here
        .expect(403);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/assessment/ongoing/${userId}`)
        .set(authHeader(userToken))
        .expect(200);
      expect(res.body.id).toBe(assessmentId);
    });

    it('retrieves each question package without leaking which answer is correct', async () => {
      for (let i = 0; i < 4; i++) {
        const res = await request(app.getHttpServer())
          .get(`/api/v1/assessment/${assessmentId}/${i}`)
          .set(authHeader(userToken))
          .expect(200);
        expect(res.body.question.id).toBeDefined();
        expect(res.body.question.answers.length).toBe(2);
        expect(res.body.question.answers.every((a: any) => !('is_correct' in a))).toBe(true);
      }
    });

    it('a different user cannot mark this assessment\'s question instances (IDOR)', async () => {
      const pkg = await request(app.getHttpServer())
        .get(`/api/v1/assessment/${assessmentId}/0`)
        .set(authHeader(userToken))
        .expect(200);

      await request(app.getHttpServer())
        .put(`/api/v1/mark/${pkg.body.id}`)
        .set(authHeader(adminToken))
        .send({ question_id: pkg.body.question.id, selected_answers: pkg.body.question.answers[0].id })
        .expect(403);
    });

    it('grade-forging regression guard: marking a wrong answer with a forged is_correct:true is still graded wrong', async () => {
      const pkg = await request(app.getHttpServer())
        .get(`/api/v1/assessment/${assessmentId}/0`)
        .set(authHeader(userToken))
        .expect(200);

      // Resolve the actually-correct answer text for whatever question landed
      // here (shuffled by getRandomBatch), then deliberately pick the OTHER
      // one, while also smuggling is_correct: true in the payload - exactly
      // like the original vulnerability report.
      const correctText = correctAnswerTextByBody.get(pkg.body.question.body);
      const wrongAnswer = pkg.body.question.answers.find((a: any) => a.body !== correctText);
      const wrongAnswerId = wrongAnswer.id;
      await request(app.getHttpServer())
        .put(`/api/v1/mark/${pkg.body.id}`)
        .set(authHeader(userToken))
        .send({ question_id: pkg.body.question.id, selected_answers: wrongAnswerId, is_correct: true } as any)
        .expect(200);

      const review = await request(app.getHttpServer())
        .get(`/api/v1/assessment/review/${assessmentId}`)
        .set(authHeader(userToken))
        .expect(200);
      const marked = review.body.find((qi: any) => qi.id === pkg.body.id);
      expect(marked.selected_answers).toBe(wrongAnswerId);
      // Confirmed via the report endpoint below that this instance is counted
      // as wrong server-side, not client-dictated.
    });

    it('marks the remaining 3 questions correctly', async () => {
      for (let i = 1; i < 4; i++) {
        const pkg = await request(app.getHttpServer())
          .get(`/api/v1/assessment/${assessmentId}/${i}`)
          .set(authHeader(userToken))
          .expect(200);
        const correctText = correctAnswerTextByBody.get(pkg.body.question.body);
        const correctAnswer = pkg.body.question.answers.find((a: any) => a.body === correctText);
        await request(app.getHttpServer())
          .put(`/api/v1/mark/${pkg.body.id}`)
          .set(authHeader(userToken))
          .send({ question_id: pkg.body.question.id, selected_answers: correctAnswer.id })
          .expect(200);
      }
    });

    it('a different user cannot submit this assessment (IDOR)', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/assessment/submit/${assessmentId}`)
        .set(authHeader(adminToken))
        .expect(403);
    });

    it('submits and grades correctly: 3 of 4 correct = 75%, passing_grade is 75', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/assessment/submit/${assessmentId}`)
        .set(authHeader(userToken))
        .expect(200);

      expect(res.body.grade).toBeCloseTo(75, 5); // 3/4, NOT 3/60
      expect(res.body.pass).toBeTruthy(); // 75 >= category's passing_grade of 75
      expect(res.body.submitted).toBeTruthy();
    });

    it('GET /assessment/report/:assessmentID returns total=4 and exactly the one forged-but-actually-wrong question', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/assessment/report/${assessmentId}`)
        .set(authHeader(userToken))
        .expect(200);

      expect(res.body.total).toBe(4);
      expect(res.body.questions.length).toBe(1); // the grade-forging attempt did NOT fool the grader
    });

    it('GET /assessment/list/:userID: self works, a different non-admin user is rejected, admin works', async () => {
      const throwawayEmail = uniqueTestEmail('e2e-assess-idor');
      const reg = await request(app.getHttpServer())
        .post('/api/v1/session/reg')
        .send({ email: throwawayEmail, full_name: 'Assess IDOR Throwaway', password: 'ThrowawayPass!2026' })
        .expect(201);
      createdUserIds.push(reg.body.id);
      await request(app.getHttpServer())
        .put('/api/v1/users/active')
        .set(authHeader(adminToken))
        .send({ id: reg.body.id, state: true })
        .expect(200);
      const throwawayLogin = await request(app.getHttpServer())
        .post('/api/v1/session/login')
        .send({ email: throwawayEmail, password: 'ThrowawayPass!2026' })
        .expect(201);

      await request(app.getHttpServer())
        .get(`/api/v1/assessment/list/${userId}`)
        .set(authHeader(userToken))
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/v1/assessment/list/${userId}`)
        .set({ Authorization: `Bearer ${throwawayLogin.body.authToken}` })
        .expect(403);

      const asAdmin = await request(app.getHttpServer())
        .get(`/api/v1/assessment/list/${userId}`)
        .set(authHeader(adminToken))
        .expect(200);
      expect(asAdmin.body.some((a: any) => a.id === assessmentId)).toBe(true);
    });
  });

  describe('GET /assessment/stats (Admin-only)', () => {
    it('rejects a non-admin caller and returns the assigned/training shape for an admin', async () => {
      await request(app.getHttpServer()).get('/api/v1/assessment/stats').set(authHeader(userToken)).expect(403);

      const res = await request(app.getHttpServer())
        .get('/api/v1/assessment/stats')
        .set(authHeader(adminToken))
        .expect(200);
      expect(res.body).toHaveProperty('assigned');
      expect(res.body).toHaveProperty('training');
      expect(res.body.training).toHaveProperty('totalAttempts');
      expect(res.body.training).toHaveProperty('avgScore');
      expect(res.body.training).toHaveProperty('passRate');
    });
  });

  describe('admin-only maintenance/analytics endpoints run without error', () => {
    it('GET /assessment/assigned', async () => {
      await request(app.getHttpServer()).get('/api/v1/assessment/assigned').set(authHeader(userToken)).expect(403);
      const res = await request(app.getHttpServer()).get('/api/v1/assessment/assigned').set(authHeader(adminToken)).expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
