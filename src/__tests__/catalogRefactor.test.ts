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
    sendOrderCancelledEmail: jest.fn().mockResolvedValue({ messageId: 'mock' }),
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

describe('Category/Product catalog refactor', () => {
  it('auto-fills fr/ar from en when a category is created with only one language', async () => {
    const adminToken = await createUserAndLogin('catalog-admin1@test.com', USER_ROLES.ADMIN);

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Textures' } });

    expect(res.status).toBe(200);
    expect(res.body.name).toEqual({ en: 'Textures', fr: 'Textures', ar: 'Textures' });
  });

  it('rejects a category with no language at all', async () => {
    const adminToken = await createUserAndLogin('catalog-admin2@test.com', USER_ROLES.ADMIN);

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: {} });

    expect(res.status).toBe(400);
  });

  it('rejects product creation with an empty categories array and accepts multiple categories', async () => {
    const adminToken = await createUserAndLogin('catalog-admin3@test.com', USER_ROLES.ADMIN);

    const catA = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Wood' } });
    const catB = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Marble' } });

    const basePayload = {
      name: { en: 'Panel', fr: 'Panneau', ar: 'لوح' },
      description: { en: 'desc', fr: 'desc', ar: 'وصف' },
      price: 10,
    };

    const rejected = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...basePayload, categories: [] });
    expect(rejected.status).toBe(400);

    const accepted = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...basePayload, categories: [catA.body._id, catB.body._id] });
    expect(accepted.status).toBe(200);
    expect(accepted.body.categories).toHaveLength(2);
    expect(accepted.body.currency).toBe('TND');
  });

  it('blocks deleting a category that a non-deleted product still references', async () => {
    const adminToken = await createUserAndLogin('catalog-admin4@test.com', USER_ROLES.ADMIN);

    const category = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Fabric' } });

    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: { en: 'Linen Panel', fr: 'Panneau lin', ar: 'لوح كتان' },
        description: { en: 'desc', fr: 'desc', ar: 'وصف' },
        price: 20,
        categories: [category.body._id],
      });

    const deleteRes = await request(app)
      .delete(`/api/categories/${category.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(400);
  });
});
