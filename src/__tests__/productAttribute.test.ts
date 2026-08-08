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

async function setupCatalog(adminToken: string) {
  const categoryRes = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: { en: 'Panels' } });

  const attributeRes = await request(app)
    .post('/api/product-attributes')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: { en: 'Finish' },
      options: [{ en: 'Royal Mirror' }, { en: 'Celestial Midnight' }, { en: 'Oulan-Bator' }],
    });
  const [royalMirror, celestialMidnight, oulanBator] = attributeRes.body.options;

  const productRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: { en: 'Mirror Panel' },
      description: { en: 'desc' },
      price: 600,
      categories: [categoryRes.body._id],
      stock: 10,
      attributeOptions: [
        { attribute: attributeRes.body._id, option: royalMirror._id, priceAdjustment: 0 },
        { attribute: attributeRes.body._id, option: celestialMidnight._id, priceAdjustment: 100 },
        { attribute: attributeRes.body._id, option: oulanBator._id, priceAdjustment: -50 },
      ],
    });

  return { attribute: attributeRes.body, royalMirror, celestialMidnight, oulanBator, product: productRes.body };
}

describe('Product settings (attribute types + per-product option pricing)', () => {
  it('lets ADMIN create an attribute type with options that carry no price', async () => {
    const adminToken = await createUserAndLogin('attr-admin1@test.com', USER_ROLES.ADMIN);

    const res = await request(app)
      .post('/api/product-attributes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Texture' }, options: [{ en: 'Wood' }, { en: 'Marble' }] });

    expect(res.status).toBe(200);
    expect(res.body.options).toHaveLength(2);
    expect(res.body.options[0].name.en).toBe('Wood');
    expect(res.body.options[0].priceAdjustment).toBeUndefined();
  });

  it('rejects a CLIENT creating an attribute type', async () => {
    const clientToken = await createUserAndLogin('attr-client1@test.com', USER_ROLES.CLIENT);
    const res = await request(app)
      .post('/api/product-attributes')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: { en: 'Texture' } });
    expect(res.status).toBe(403);
  });

  it('adds the price adjustment only at the product level, and computes cart price with the adjustment applied', async () => {
    const adminToken = await createUserAndLogin('attr-admin2@test.com', USER_ROLES.ADMIN);
    const clientToken = await createUserAndLogin('attr-client2@test.com', USER_ROLES.CLIENT);
    const { attribute, celestialMidnight, oulanBator, product } = await setupCatalog(adminToken);

    // Default option -> base price.
    const addDefault = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ product: product._id, quantity: 1, selectedOptions: [{ attribute: attribute._id, option: celestialMidnight._id }] });
    expect(addDefault.status).toBe(200);
    expect(addDefault.body.items[0].unitPrice).toBe(700); // 600 + 100

    await request(app).delete('/api/cart').set('Authorization', `Bearer ${clientToken}`);

    const addDiscounted = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ product: product._id, quantity: 1, selectedOptions: [{ attribute: attribute._id, option: oulanBator._id }] });
    expect(addDiscounted.status).toBe(200);
    expect(addDiscounted.body.items[0].unitPrice).toBe(550); // 600 - 50
  });

  it('rejects adding to cart without selecting an option for a configured attribute', async () => {
    const adminToken = await createUserAndLogin('attr-admin3@test.com', USER_ROLES.ADMIN);
    const clientToken = await createUserAndLogin('attr-client3@test.com', USER_ROLES.CLIENT);
    const { product } = await setupCatalog(adminToken);

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ product: product._id, quantity: 1 });
    expect(res.status).toBe(400);
  });

  it('rejects an option that is not configured on this product', async () => {
    const adminToken = await createUserAndLogin('attr-admin4@test.com', USER_ROLES.ADMIN);
    const clientToken = await createUserAndLogin('attr-client4@test.com', USER_ROLES.CLIENT);
    const { attribute, product } = await setupCatalog(adminToken);

    const otherAttrRes = await request(app)
      .post('/api/product-attributes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'Thickness' }, options: [{ en: '8mm' }] });
    const bogusOption = otherAttrRes.body.options[0];

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ product: product._id, quantity: 1, selectedOptions: [{ attribute: attribute._id, option: bogusOption._id }] });
    expect(res.status).toBe(400);
  });

  it('keeps two different option selections of the same product as separate cart lines', async () => {
    const adminToken = await createUserAndLogin('attr-admin5@test.com', USER_ROLES.ADMIN);
    const clientToken = await createUserAndLogin('attr-client5@test.com', USER_ROLES.CLIENT);
    const { attribute, celestialMidnight, oulanBator, product } = await setupCatalog(adminToken);

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ product: product._id, quantity: 1, selectedOptions: [{ attribute: attribute._id, option: celestialMidnight._id }] });

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ product: product._id, quantity: 1, selectedOptions: [{ attribute: attribute._id, option: oulanBator._id }] });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);

    // Adding the same combination again merges into the existing line instead of a third one.
    const again = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ product: product._id, quantity: 2, selectedOptions: [{ attribute: attribute._id, option: celestialMidnight._id }] });
    expect(again.body.items).toHaveLength(2);
    const mergedItem = again.body.items.find((item: any) => item.quantity === 3);
    expect(mergedItem).toBeTruthy();
  });

  it('snapshots selected option names and the adjusted price onto the order at checkout', async () => {
    const adminToken = await createUserAndLogin('attr-admin6@test.com', USER_ROLES.ADMIN);
    const clientToken = await createUserAndLogin('attr-client6@test.com', USER_ROLES.CLIENT);
    const { attribute, celestialMidnight, product } = await setupCatalog(adminToken);

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ product: product._id, quantity: 1, selectedOptions: [{ attribute: attribute._id, option: celestialMidnight._id }] });

    const orderRes = await request(app).post('/api/orders').set('Authorization', `Bearer ${clientToken}`).send({});
    expect(orderRes.status).toBe(200);
    expect(orderRes.body.totalAmount).toBe(700);
    expect(orderRes.body.items[0].price).toBe(700);
    expect(orderRes.body.items[0].selectedOptions[0]).toMatchObject({
      attributeName: { en: 'Finish' },
      optionName: { en: 'Celestial Midnight' },
      priceAdjustment: 100,
    });
  });
});
