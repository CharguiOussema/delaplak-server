import request from 'supertest';
import { createExpressServer } from '../server';
import { UserModel } from '../models/user.model';
import { hash } from '../services/bcrypt.service';
import { USER_ROLES } from '../types/consts';

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

async function createUserAndLogin(email: string, role: USER_ROLES) {
  const passwordHash = await hash('Password123!');
  await UserModel.create({ email, passwordHash, role, isActive: true });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Password123!' });
  return res.body.accessToken as string;
}

const validCategoryPayload = { name: { en: 'Test Cat', fr: 'Cat Test', ar: 'فئة اختبار' } };

describe('RBAC gating', () => {
  it('a CLIENT hitting an ADMIN-only route (create category) gets 403', async () => {
    const token = await createUserAndLogin('rbac-client@test.com', USER_ROLES.CLIENT);

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(validCategoryPayload);

    expect(res.status).toBe(403);
  });

  it('an ADMIN can create a category', async () => {
    const token = await createUserAndLogin('rbac-admin@test.com', USER_ROLES.ADMIN);

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(validCategoryPayload);

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('test-cat');
  });

  it('both roles can browse categories (GET list)', async () => {
    for (const role of [USER_ROLES.CLIENT, USER_ROLES.ADMIN]) {
      const token = await createUserAndLogin(`browse-${role}@test.com`, role);
      const res = await request(app).get('/api/categories').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    }
  });
});
