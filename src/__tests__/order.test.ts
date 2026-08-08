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
    sendOrderCancelledEmail: jest.fn().mockResolvedValue({ messageId: 'mock' }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ messageId: 'mock' }),
  },
  sendTemplateEmail: jest.fn().mockResolvedValue({ messageId: 'mock' }),
  sendRawEmail: jest.fn().mockResolvedValue({ messageId: 'mock' }),
}));

import { mailerService } from '../services/mailer.service';

const app = createExpressServer();

// Phone is unique per user now, so every user created in this file needs its own number.
let phoneSeq = 0;

async function createUserAndLogin(email: string, role: USER_ROLES) {
  phoneSeq += 1;
  const passwordHash = await hash('Password123!');
  const phone = `+21260000${String(phoneSeq).padStart(4, '0')}`;
  await UserModel.create({ email, fullName: 'Test User', phone, passwordHash, role, isActive: true });
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
        categories: [categoryRes.body._id],
        stock: 5,
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

    // Stock is only reserved on confirmation, not at order creation time.
    const productAfterOrder = await request(app).get(`/api/products/${productId}`).set('Authorization', `Bearer ${clientToken}`);
    expect(productAfterOrder.body.stock).toBe(5);

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

    // Stock is decremented by the ordered quantity only once the order is confirmed.
    const productAfterConfirm = await request(app).get(`/api/products/${productId}`).set('Authorization', `Bearer ${clientToken}`);
    expect(productAfterConfirm.body.stock).toBe(3);

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

  it('cancels a pending order and rejects confirming/cancelling it again', async () => {
    const adminToken = await createUserAndLogin('cancel-admin@test.com', USER_ROLES.ADMIN);
    const clientToken = await createUserAndLogin('cancel-client@test.com', USER_ROLES.CLIENT);

    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Marble' } });

    const productRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: { en: 'Marble Panel', fr: 'Panneau marbre', ar: 'لوح رخام' },
        description: { en: 'desc', fr: 'desc', ar: 'وصف' },
        price: 50,
        categories: [categoryRes.body._id],
        stock: 3,
      });

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ product: productRes.body._id, quantity: 1 });

    const orderRes = await request(app).post('/api/orders').set('Authorization', `Bearer ${clientToken}`).send({});

    // A CLIENT may cancel their own pending order.
    const cancelRes = await request(app)
      .patch(`/api/orders/${orderRes.body._id}/cancel`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.status).toBe('CANCELLED');

    // Once cancelled, the decision is final: neither cancel nor confirm may run again.
    const cancelAgain = await request(app)
      .patch(`/api/orders/${orderRes.body._id}/cancel`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(cancelAgain.status).toBe(400);

    const confirmAfterCancel = await request(app)
      .patch(`/api/orders/${orderRes.body._id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(confirmAfterCancel.status).toBe(400);
  });

  it('lets ADMIN cancel any order but rejects a CLIENT cancelling someone else\'s', async () => {
    const adminToken = await createUserAndLogin('cancel-admin2@test.com', USER_ROLES.ADMIN);
    const ownerToken = await createUserAndLogin('cancel-owner@test.com', USER_ROLES.CLIENT);
    const otherClientToken = await createUserAndLogin('cancel-other-client@test.com', USER_ROLES.CLIENT);

    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Fabric' } });
    const productRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: { en: 'Linen Panel', fr: 'Panneau lin', ar: 'لوح كتان' },
        description: { en: 'desc', fr: 'desc', ar: 'وصف' },
        price: 30,
        categories: [categoryRes.body._id],
        stock: 3,
      });
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ product: productRes.body._id, quantity: 1 });
    const orderRes = await request(app).post('/api/orders').set('Authorization', `Bearer ${ownerToken}`).send({});

    // A different CLIENT may not cancel someone else's order.
    const otherCancelAttempt = await request(app)
      .patch(`/api/orders/${orderRes.body._id}/cancel`)
      .set('Authorization', `Bearer ${otherClientToken}`);
    expect(otherCancelAttempt.status).toBe(403);

    // ADMIN may cancel it regardless of ownership.
    const adminCancelRes = await request(app)
      .patch(`/api/orders/${orderRes.body._id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminCancelRes.status).toBe(200);
    expect(adminCancelRes.body.status).toBe('CANCELLED');
  });

  it('rejects adding more items to the cart than are in stock', async () => {
    const adminToken = await createUserAndLogin('stock-cart-admin@test.com', USER_ROLES.ADMIN);
    const clientToken = await createUserAndLogin('stock-cart-client@test.com', USER_ROLES.CLIENT);

    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Tile' } });
    const productRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: { en: 'Ceramic Tile', fr: 'Carreau', ar: 'بلاط' },
        description: { en: 'desc', fr: 'desc', ar: 'وصف' },
        price: 10,
        categories: [categoryRes.body._id],
        stock: 2,
      });

    const addToCartRes = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ product: productRes.body._id, quantity: 3 });
    expect(addToCartRes.status).toBe(400);
  });

  it('rejects order creation when the cart quantity exceeds current stock', async () => {
    const adminToken = await createUserAndLogin('stock-order-admin@test.com', USER_ROLES.ADMIN);
    const clientToken = await createUserAndLogin('stock-order-client@test.com', USER_ROLES.CLIENT);

    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Granite' } });
    const productRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: { en: 'Granite Slab', fr: 'Dalle granit', ar: 'بلاطة غرانيت' },
        description: { en: 'desc', fr: 'desc', ar: 'وصف' },
        price: 20,
        categories: [categoryRes.body._id],
        stock: 2,
      });

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ product: productRes.body._id, quantity: 2 });

    // Stock drops below the cart quantity after it was added (e.g. an admin correction).
    await request(app)
      .patch(`/api/products/${productRes.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stock: 1 });

    const createOrderRes = await request(app).post('/api/orders').set('Authorization', `Bearer ${clientToken}`).send({});
    expect(createOrderRes.status).toBe(400);
  });

  it('rejects confirming an order once another confirmed order has consumed the remaining stock', async () => {
    const adminToken = await createUserAndLogin('stock-race-admin@test.com', USER_ROLES.ADMIN);
    const clientAToken = await createUserAndLogin('stock-race-client-a@test.com', USER_ROLES.CLIENT);
    const clientBToken = await createUserAndLogin('stock-race-client-b@test.com', USER_ROLES.CLIENT);

    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Limestone' } });
    const productRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: { en: 'Limestone Block', fr: 'Bloc calcaire', ar: 'كتلة حجر جيري' },
        description: { en: 'desc', fr: 'desc', ar: 'وصف' },
        price: 15,
        categories: [categoryRes.body._id],
        stock: 1,
      });
    const productId = productRes.body._id;

    // Both clients order the same single unit while it's still available.
    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${clientAToken}`).send({ product: productId, quantity: 1 });
    const orderA = await request(app).post('/api/orders').set('Authorization', `Bearer ${clientAToken}`).send({});
    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${clientBToken}`).send({ product: productId, quantity: 1 });
    const orderB = await request(app).post('/api/orders').set('Authorization', `Bearer ${clientBToken}`).send({});

    // First confirmation wins and takes the last unit.
    const confirmA = await request(app).patch(`/api/orders/${orderA.body._id}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(confirmA.status).toBe(200);

    // Second confirmation must fail without touching stock further, leaving the order PENDING.
    const confirmB = await request(app).patch(`/api/orders/${orderB.body._id}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    expect(confirmB.status).toBe(400);

    const orderBAfter = await request(app).get(`/api/orders/${orderB.body._id}`).set('Authorization', `Bearer ${clientBToken}`);
    expect(orderBAfter.body.status).toBe('PENDING');

    const productAfter = await request(app).get(`/api/products/${productId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(productAfter.body.stock).toBe(0);
  });
});
