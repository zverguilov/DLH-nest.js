import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootApp, login, authHeader, uniqueTestEmail, deleteUserAsAdmin, TEST_ADMIN, TEST_USER } from './support/e2e-setup';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let userId: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await bootApp();
    const admin = await login(app, TEST_ADMIN.email, TEST_ADMIN.password);
    adminToken = admin.token;
    adminId = admin.id;
    const user = await login(app, TEST_USER.email, TEST_USER.password);
    userToken = user.token;
    userId = user.id;
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      await deleteUserAsAdmin(app, adminToken, id);
    }
    await app.close();
  });

  describe('GET /users (Admin-only)', () => {
    it('rejects a non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set(authHeader(userToken))
        .expect(403);
    });

    it('allows an admin and returns a list including the dedicated test accounts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set(authHeader(adminToken))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((u: any) => u.id === userId)).toBe(true);
    });

    it('rejects requests with no token at all', async () => {
      await request(app.getHttpServer()).get('/api/v1/users').expect(401);
    });
  });

  describe('GET /users/:userID (self-or-Admin)', () => {
    it('allows a user to view their own profile', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set(authHeader(userToken))
        .expect(200);
      expect(res.body.id).toBe(userId);
      expect(res.body).not.toHaveProperty('password');
    });

    it('rejects a non-admin user looking up a different user (real IDOR check between the two live test accounts)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/users/${adminId}`)
        .set(authHeader(userToken))
        .expect(403);
    });

    it('allows an Admin to look up any user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set(authHeader(adminToken))
        .expect(200);
      expect(res.body.id).toBe(userId);
    });
  });

  describe('admin-gated mutation endpoints', () => {
    let throwawayId: string;
    const throwawayEmail = uniqueTestEmail('e2e-users-mutation');

    beforeAll(async () => {
      const reg = await request(app.getHttpServer())
        .post('/api/v1/session/reg')
        .send({ email: throwawayEmail, full_name: 'Mutation Target', password: 'ThrowawayPass!2026' })
        .expect(201);
      throwawayId = reg.body.id;
      createdUserIds.push(throwawayId);
    });

    it('setAdminRights rejects a non-admin caller', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/users/admin')
        .set(authHeader(userToken))
        .send({ id: throwawayId, admin: true })
        .expect(403);
    });

    it('setAdminRights actually promotes and demotes the target user', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/users/admin')
        .set(authHeader(adminToken))
        .send({ id: throwawayId, admin: true })
        .expect(200);

      let profile = await request(app.getHttpServer())
        .get(`/api/v1/users/${throwawayId}`)
        .set(authHeader(adminToken))
        .expect(200);
      expect(profile.body.role).toBe('Admin');

      await request(app.getHttpServer())
        .put('/api/v1/users/admin')
        .set(authHeader(adminToken))
        .send({ id: throwawayId, admin: false })
        .expect(200);

      profile = await request(app.getHttpServer())
        .get(`/api/v1/users/${throwawayId}`)
        .set(authHeader(adminToken))
        .expect(200);
      expect(profile.body.role).toBe('User');
    });

    it('setActive rejects a non-admin caller', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/users/active')
        .set(authHeader(userToken))
        .send({ id: throwawayId, state: true })
        .expect(403);
    });

    it('setActive actually flips the user\'s state, and a StateGuard-protected route enforces it', async () => {
      // A freshly registered (non-first) user starts Locked in the DB.
      let profile = await request(app.getHttpServer())
        .get(`/api/v1/users/${throwawayId}`)
        .set(authHeader(adminToken))
        .expect(200);
      expect(profile.body.state).toBe('Locked');

      // getUserByID itself has no StateGuard (a Locked user can still view their own
      // profile by design), so use a route that does enforce it to prove the gate works.
      const loginAttempt = await request(app.getHttpServer())
        .post('/api/v1/session/login')
        .send({ email: throwawayEmail, password: 'ThrowawayPass!2026' })
        .expect(201);
      await request(app.getHttpServer())
        .get(`/api/v1/assessment/ongoing/${throwawayId}`)
        .set(authHeader(loginAttempt.body.authToken))
        .expect(403); // StateGuard rejects a Locked user here

      await request(app.getHttpServer())
        .put('/api/v1/users/active')
        .set(authHeader(adminToken))
        .send({ id: throwawayId, state: true })
        .expect(200);

      profile = await request(app.getHttpServer())
        .get(`/api/v1/users/${throwawayId}`)
        .set(authHeader(adminToken))
        .expect(200);
      expect(profile.body.state).toBe('Active');

      // role/state are baked into the JWT at issuance (JwtStrategy trusts the token
      // payload, not a fresh DB lookup) - the old token is still Locked until reissued.
      await request(app.getHttpServer())
        .get(`/api/v1/assessment/ongoing/${throwawayId}`)
        .set(authHeader(loginAttempt.body.authToken))
        .expect(403);

      const freshLogin = await request(app.getHttpServer())
        .post('/api/v1/session/login')
        .send({ email: throwawayEmail, password: 'ThrowawayPass!2026' })
        .expect(201);
      await request(app.getHttpServer())
        .get(`/api/v1/assessment/ongoing/${throwawayId}`)
        .set(authHeader(freshLogin.body.authToken))
        .expect(200); // a freshly-issued token reflects the now-Active state
    });

    it('resetPassword rejects a non-admin caller', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/users/reset-password')
        .set(authHeader(userToken))
        .send({ id: throwawayId, password: 'NewPassword!2026' })
        .expect(403);
    });

    it('resetPassword actually changes the password so the old one stops working and the new one works', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/users/reset-password')
        .set(authHeader(adminToken))
        .send({ id: throwawayId, password: 'BrandNewPassword!2026' })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/session/login')
        .send({ email: throwawayEmail, password: 'ThrowawayPass!2026' })
        .expect(400); // old password now rejected

      await request(app.getHttpServer())
        .post('/api/v1/session/login')
        .send({ email: throwawayEmail, password: 'BrandNewPassword!2026' })
        .expect(201); // new password works
    });

    it('deleteUser rejects a non-admin caller, and an admin can delete the throwaway account', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${throwawayId}`)
        .set(authHeader(userToken))
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/api/v1/users/${throwawayId}`)
        .set(authHeader(adminToken))
        .expect(200);

      // Already deleted - remove from the afterAll cleanup list so it isn't deleted twice.
      const idx = createdUserIds.indexOf(throwawayId);
      if (idx >= 0) createdUserIds.splice(idx, 1);
    });
  });

  describe('GET /users/top/:assigned', () => {
    it('rejects a non-admin caller and returns an array for an admin', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/top/true')
        .set(authHeader(userToken))
        .expect(403);

      const res = await request(app.getHttpServer())
        .get('/api/v1/users/top/true')
        .set(authHeader(adminToken))
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
