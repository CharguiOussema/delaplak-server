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

let phoneSeq = 0;

async function createUserAndLogin(email: string, role: USER_ROLES) {
  phoneSeq += 1;
  const passwordHash = await hash('Password123!');
  const phone = `+21262000${String(phoneSeq).padStart(4, '0')}`;
  await UserModel.create({ email, fullName: 'Test User', phone, passwordHash, role, isActive: true });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Password123!' });
  return res.body.accessToken as string;
}

describe('Dashboard stats (ADMIN-only)', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(401);
  });

  it('rejects a CLIENT', async () => {
    const clientToken = await createUserAndLogin('dash-client1@test.com', USER_ROLES.CLIENT);
    const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
  });

  it('returns aggregated stats for ADMIN, reflecting real catalog/order/user data', async () => {
    const adminToken = await createUserAndLogin('dash-admin1@test.com', USER_ROLES.ADMIN);
    const clientToken = await createUserAndLogin('dash-client2@test.com', USER_ROLES.CLIENT);

    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Wood' } });

    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Oak Panel' }, description: { en: 'desc' }, price: 100, categories: [categoryRes.body._id], stock: 3 });

    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Marble Panel' }, description: { en: 'desc' }, price: 200, categories: [categoryRes.body._id], stock: 50 });

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ product: (await request(app).get('/api/products/filter')).body[0].value, quantity: 1 });
    await request(app).post('/api/orders').set('Authorization', `Bearer ${clientToken}`).send({});

    const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.products.total).toBe(2);
    expect(res.body.products.totalStock).toBe(53);
    expect(res.body.products.lowStockCount).toBe(1); // stock 3 <= threshold, stock 50 isn't
    expect(res.body.products.byCategory).toEqual([{ label: 'Wood', value: 2 }]);
    expect(res.body.categories.total).toBe(1);
    expect(res.body.orders.total).toBe(1);
    expect(res.body.orders.byStatus.find((s: any) => s.status === 'PENDING').count).toBe(1);
    expect(res.body.users.total).toBe(2);
    expect(res.body.users.byRole.find((r: any) => r.role === 'ADMIN').count).toBe(1);
    expect(res.body.users.byRole.find((r: any) => r.role === 'CLIENT').count).toBe(1);
    expect(res.body.invoices.total).toBe(0);
    expect(res.body.lowStockProducts).toHaveLength(1);
    expect(res.body.lowStockProducts[0].stock).toBe(3);
    expect(res.body.orders.trend).toHaveLength(14);
  });
});
