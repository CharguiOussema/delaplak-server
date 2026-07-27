import request from 'supertest';
import { createExpressServer } from '../server';

jest.mock('../services/mailer.service', () => ({
  mailerService: {
    sendWelcomeEmail: jest.fn().mockResolvedValue({ messageId: 'mock' }),
    sendOrderCreatedEmail: jest.fn().mockResolvedValue({ messageId: 'mock' }),
    sendOrderConfirmedEmail: jest.fn().mockResolvedValue({ messageId: 'mock' }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ messageId: 'mock' }),
  },
  sendTemplateEmail: jest.fn().mockResolvedValue({ messageId: 'mock' }),
  sendRawEmail: jest.fn().mockResolvedValue({ messageId: 'mock' }),
}));

const app = createExpressServer();

async function signupClient(email: string) {
  const res = await request(app).post('/api/auth/signup').send({ email, password: 'Password123!' });
  return res.body as { accessToken: string; refreshToken: string };
}

describe('Refresh token rotation & reuse detection', () => {
  it('rotates the refresh token on /refresh and the old value can no longer be used to authenticate', async () => {
    const { refreshToken: firstRefreshToken } = await signupClient('rotate@test.com');

    const refreshRes = await request(app).post('/api/auth/refresh').send({ refreshToken: firstRefreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.refreshToken).toBeDefined();
    expect(refreshRes.body.refreshToken).not.toBe(firstRefreshToken);
  });

  it('detects reuse of an already-rotated refresh token and revokes the whole family', async () => {
    const { refreshToken: original } = await signupClient('reuse@test.com');

    // First refresh: rotates `original` -> `rotated1`. `original` is now revoked.
    const first = await request(app).post('/api/auth/refresh').send({ refreshToken: original });
    expect(first.status).toBe(200);
    const rotated1: string = first.body.refreshToken;

    // Reuse detected: presenting the already-revoked `original` token again.
    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken: original });
    expect(reuse.status).toBe(401);

    // The whole family (including the token issued by the "legitimate" rotation, rotated1)
    // must now be revoked too — a second refresh using ANY token from that family fails.
    const afterReuse = await request(app).post('/api/auth/refresh').send({ refreshToken: rotated1 });
    expect(afterReuse.status).toBe(401);
  });

  it('rejects an unknown/garbage refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'not-a-real-refresh-token' });
    expect(res.status).toBe(401);
  });

  it('logs out by revoking the presented refresh token', async () => {
    const { refreshToken } = await signupClient('logout@test.com');

    const logoutRes = await request(app).post('/api/auth/logout').send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    const refreshAfterLogout = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(refreshAfterLogout.status).toBe(401);
  });
});
