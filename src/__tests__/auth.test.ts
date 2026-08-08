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

// Phone is unique per user now, so every signup in this file needs its own number.
let phoneSeq = 0;
function signupExtras() {
  phoneSeq += 1;
  return { fullName: 'Test Client', phone: `+21260000${String(phoneSeq).padStart(4, '0')}` };
}

describe('Auth: signup & login', () => {
  it('signs a new CLIENT up and returns an access + refresh token pair', async () => {
    const extras = signupExtras();
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'client1@test.com', password: 'Password123!', ...extras });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('client1@test.com');
    expect(res.body.user.fullName).toBe(extras.fullName);
    expect(res.body.user.phone).toBe(extras.phone);
    expect(res.body.user.role).toBe('CLIENT');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
    expect(res.headers['set-cookie']?.[0]).toMatch(/refreshToken=/);
  });

  it('rejects signup with a duplicate email', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dupe@test.com', password: 'Password123!', ...signupExtras() });
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dupe@test.com', password: 'Password123!', ...signupExtras() });
    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'client2@test.com', password: 'Password123!', ...signupExtras() });

    const good = await request(app).post('/api/auth/login').send({ email: 'client2@test.com', password: 'Password123!' });
    expect(good.status).toBe(200);
    expect(typeof good.body.accessToken).toBe('string');

    const bad = await request(app).post('/api/auth/login').send({ email: 'client2@test.com', password: 'WrongPassword' });
    expect(bad.status).toBe(401);
  });

  it('GET /api/auth/me returns the current authenticated user', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'client3@test.com', password: 'Password123!', ...signupExtras() });

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${signup.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('client3@test.com');
  });

  it('rejects requests with no/invalid access token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);

    const res2 = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res2.status).toBe(401);
  });
});
