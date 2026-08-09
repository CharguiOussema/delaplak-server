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
  const phone = `+21261000${String(phoneSeq).padStart(4, '0')}`;
  await UserModel.create({ email, fullName: 'Test User', phone, passwordHash, role, isActive: true });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Password123!' });
  return res.body.accessToken as string;
}

describe('Site settings (home page content, ADMIN-only writes)', () => {
  it('serves the default home content publicly, with no auth', async () => {
    const res = await request(app).get('/api/site-settings');
    expect(res.status).toBe(200);
    expect(res.body.hero.titleLine1.en).toBe("We're ready");
    expect(res.body.strengths.length).toBeGreaterThan(0);
    expect(res.body.decors.length).toBeGreaterThan(0);
  });

  it('lets ADMIN update hero text', async () => {
    const adminToken = await createUserAndLogin('settings-admin1@test.com', USER_ROLES.ADMIN);

    const res = await request(app)
      .patch('/api/site-settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ hero: { titleLine1: { en: 'New headline' } } });

    expect(res.status).toBe(200);
    expect(res.body.hero.titleLine1.en).toBe('New headline');
    // Untouched fields are preserved.
    expect(res.body.hero.titleAccent.en).toBe('to decorate your space');
  });

  it('rejects a CLIENT updating site settings', async () => {
    const clientToken = await createUserAndLogin('settings-client1@test.com', USER_ROLES.CLIENT);
    const res = await request(app)
      .patch('/api/site-settings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ hero: { titleLine1: { en: 'Hacked' } } });
    expect(res.status).toBe(403);
  });

  it('rejects an unauthenticated update', async () => {
    const res = await request(app).patch('/api/site-settings').send({ hero: { titleLine1: { en: 'Hacked' } } });
    expect(res.status).toBe(401);
  });

  it('lets ADMIN add, rename and remove a strength item', async () => {
    const adminToken = await createUserAndLogin('settings-admin2@test.com', USER_ROLES.ADMIN);

    const added = await request(app)
      .post('/api/site-settings/strengths')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ text: { en: 'Fire resistant' } });
    expect(added.status).toBe(200);
    const item = added.body.strengths.find((s: any) => s.text.en === 'Fire resistant');
    expect(item).toBeTruthy();

    const renamed = await request(app)
      .patch(`/api/site-settings/strengths/${item._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ text: { en: 'Fully fire resistant' } });
    expect(renamed.status).toBe(200);
    expect(renamed.body.strengths.find((s: any) => s._id === item._id).text.en).toBe('Fully fire resistant');

    const removed = await request(app)
      .delete(`/api/site-settings/strengths/${item._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(removed.status).toBe(200);
    expect(removed.body.strengths.find((s: any) => s._id === item._id)).toBeUndefined();
  });

  it('lets ADMIN add and remove a décor item, and upload its image', async () => {
    const adminToken = await createUserAndLogin('settings-admin3@test.com', USER_ROLES.ADMIN);

    const added = await request(app)
      .post('/api/site-settings/decors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: { en: 'Arctic Pine' } });
    expect(added.status).toBe(200);
    const item = added.body.decors.find((d: any) => d.title.en === 'Arctic Pine');
    expect(item).toBeTruthy();
    expect(item.image).toBe('');

    const withImage = await request(app)
      .post(`/api/site-settings/decors/${item._id}/image`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', Buffer.from([0x89, 0x50, 0x4e, 0x47]), { filename: 'decor.png', contentType: 'image/png' });
    expect(withImage.status).toBe(200);
    const updatedItem = withImage.body.decors.find((d: any) => d._id === item._id);
    expect(updatedItem.image).toMatch(/^\/uploads\/site-settings\//);

    const removed = await request(app)
      .delete(`/api/site-settings/decors/${item._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(removed.status).toBe(200);
    expect(removed.body.decors.find((d: any) => d._id === item._id)).toBeUndefined();
  });

  it('rejects a CLIENT uploading a hero image', async () => {
    const clientToken = await createUserAndLogin('settings-client2@test.com', USER_ROLES.CLIENT);
    const res = await request(app)
      .post('/api/site-settings/hero/main-image')
      .set('Authorization', `Bearer ${clientToken}`)
      .attach('image', Buffer.from([0x89, 0x50, 0x4e, 0x47]), { filename: 'hero.png', contentType: 'image/png' });
    expect(res.status).toBe(403);
  });
});
