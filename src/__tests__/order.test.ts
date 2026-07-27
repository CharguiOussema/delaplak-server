import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { createExpressServer } from '../server';
import { UserModel } from '../models/user.model';
import { hash } from '../services/bcrypt.service';
import { USER_ROLES } from '../types/consts';
import { ENV } from '../config';

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

import { mailerService } from '../services/mailer.service';

const app = createExpressServer();

async function createUserAndLogin(email: string, role: USER_ROLES) {
  const passwordHash = await hash('Password123!');
  await UserModel.create({ email, passwordHash, role, isActive: true });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Password123!' });
  return res.body.accessToken as string;
}

describe('Order lifecycle: create -> confirm -> invoice + emails', () => {
  it('creates an order from the cart, confirms it, generates an invoice, and fires both emails', async () => {
    const adminToken = await createUserAndLogin('order-admin@test.com', USER_ROLES.ADMIN);
    const clientToken = await createUserAndLogin('order-client@test.com', USER_ROLES.CLIENT);

    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Wood', fr: 'Bois', ar: 'خشب' } });
    expect(categoryRes.status).toBe(200);

    const productRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: { en: 'Oak Panel', fr: 'Panneau chêne', ar: 'لوح البلوط' },
        description: { en: 'desc', fr: 'desc', ar: 'وصف' },
        price: 100,
        category: categoryRes.body._id,
      });
    expect(productRes.status).toBe(200);
    const productId = productRes.body._id;

    const addToCartRes = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ product: productId, quantity: 2 });
    expect(addToCartRes.status).toBe(200);
    expect(addToCartRes.body.items).toHaveLength(1);

    const createOrderRes = await request(app).post('/api/orders').set('Authorization', `Bearer ${clientToken}`).send({});
    expect(createOrderRes.status).toBe(200);
    expect(createOrderRes.body.status).toBe('PENDING');
    expect(createOrderRes.body.totalAmount).toBe(200);
    expect(mailerService.sendOrderCreatedEmail).toHaveBeenCalledTimes(1);

    // Cart should be cleared after order creation.
    const cartAfter = await request(app).get('/api/cart').set('Authorization', `Bearer ${clientToken}`);
    expect(cartAfter.body.items).toHaveLength(0);

    // A CLIENT cannot confirm orders.
    const clientConfirmAttempt = await request(app)
      .patch(`/api/orders/${createOrderRes.body._id}/confirm`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(clientConfirmAttempt.status).toBe(403);

    const confirmRes = await request(app)
      .patch(`/api/orders/${createOrderRes.body._id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.order.status).toBe('CONFIRMED');
    expect(confirmRes.body.invoice.number).toMatch(/^INV-\d{6}$/);
    expect(mailerService.sendOrderConfirmedEmail).toHaveBeenCalledTimes(1);

    // Invoice PDF must actually exist on disk.
    const pdfFileName = path.basename(confirmRes.body.invoice.pdfPath);
    const absolutePdfPath = path.join(process.cwd(), ENV.UPLOAD_DIR, 'invoices', pdfFileName);
    expect(fs.existsSync(absolutePdfPath)).toBe(true);

    // CLIENT can fetch their own invoice + download the PDF with the right content-type.
    const invoiceId = confirmRes.body.invoice._id;
    const invoiceGetRes = await request(app)
      .get(`/api/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(invoiceGetRes.status).toBe(200);

    const pdfDownloadRes = await request(app)
      .get(`/api/invoices/${invoiceId}/pdf`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(pdfDownloadRes.status).toBe(200);
    expect(pdfDownloadRes.headers['content-type']).toBe('application/pdf');

    // A second CLIENT may not view someone else's invoice.
    const otherClientToken = await createUserAndLogin('order-other-client@test.com', USER_ROLES.CLIENT);
    const forbidden = await request(app)
      .get(`/api/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${otherClientToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('rejects order creation with an empty cart', async () => {
    const clientToken = await createUserAndLogin('empty-cart-client@test.com', USER_ROLES.CLIENT);
    const res = await request(app).post('/api/orders').set('Authorization', `Bearer ${clientToken}`).send({});
    expect(res.status).toBe(400);
  });
});
