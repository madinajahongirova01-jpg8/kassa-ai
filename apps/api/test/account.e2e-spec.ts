import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ErrorResponse } from '../src/common/error-response';
import { PrismaService } from '../src/prisma/prisma.service';

interface UserBody {
  user: { id: string; email: string; name: string | null; businessName: string | null };
}

const EMAIL = 'owner@example.com';
const PASSWORD = 'correct-horse-battery';
const NEW_PASSWORD = 'new-horse-battery-staple';

describe('Profile and password (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let token: string;

  function api(): ReturnType<typeof request> {
    return request(app.getHttpServer());
  }

  function login(password: string): request.Test {
    return api().post('/auth/login').send({ email: EMAIL, password });
  }

  function changePassword(body: object, bearer = token): request.Test {
    return api().post('/auth/change-password').auth(bearer, { type: 'bearer' }).send(body);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.useLogger(false);
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
    const response = await api()
      .post('/auth/register')
      .send({ email: EMAIL, password: PASSWORD, businessName: 'Old shop', name: 'Aziz' })
      .expect(201);
    token = (response.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('PATCH /auth/me', () => {
    it('updates the business name and name, trimmed, and /auth/me shows them right away', async () => {
      const response = await api().patch('/auth/me').auth(token, { type: 'bearer' }).send({ businessName: '  New shop ', name: ' Zafar ' }).expect(200);

      expect((response.body as UserBody).user).toMatchObject({ email: EMAIL, businessName: 'New shop', name: 'Zafar' });
      const me = await api().get('/auth/me').auth(token, { type: 'bearer' }).expect(200);
      expect((me.body as UserBody).user).toMatchObject({ businessName: 'New shop', name: 'Zafar' });
    });

    it('clears the optional name with null', async () => {
      const response = await api().patch('/auth/me').auth(token, { type: 'bearer' }).send({ name: null }).expect(200);

      expect((response.body as UserBody).user).toMatchObject({ businessName: 'Old shop', name: null });
    });

    it.each([
      ['a blank business name', { businessName: '   ' }],
      ['a null business name', { businessName: null }],
      ['a too long business name', { businessName: 'x'.repeat(101) }],
      ['a too long name', { name: 'x'.repeat(101) }],
      ['an email change', { email: 'other@example.com' }],
      ['an empty body', {}],
    ])('rejects %s', async (_case, body) => {
      const response = await api().patch('/auth/me').auth(token, { type: 'bearer' }).send(body).expect(400);

      expect((response.body as ErrorResponse).details?.length).toBeGreaterThan(0);
      const me = await api().get('/auth/me').auth(token, { type: 'bearer' }).expect(200);
      expect((me.body as UserBody).user).toMatchObject({ email: EMAIL, businessName: 'Old shop' });
    });

    it('requires a session', async () => {
      await api().patch('/auth/me').send({ businessName: 'New shop' }).expect(401);
    });
  });

  describe('POST /auth/change-password', () => {
    it('changes the password: the old one stops working, the new one works and the session stays', async () => {
      const response = await changePassword({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD }).expect(200);

      expect(response.body).toEqual({ changed: true });
      await login(PASSWORD).expect(401);
      await login(NEW_PASSWORD).expect(200);
      await api().get('/auth/me').auth(token, { type: 'bearer' }).expect(200);
    });

    it('refuses a wrong current password with a clear message', async () => {
      const response = await changePassword({ currentPassword: 'wrong-password', newPassword: NEW_PASSWORD }).expect(400);

      expect((response.body as ErrorResponse).details).toEqual(['currentPassword is incorrect']);
      await login(PASSWORD).expect(200);
    });

    it.each([
      ['a short new password', { currentPassword: PASSWORD, newPassword: 'short' }],
      ['a too long new password', { currentPassword: PASSWORD, newPassword: 'x'.repeat(129) }],
      ['the same password again', { currentPassword: PASSWORD, newPassword: PASSWORD }],
      ['a missing current password', { newPassword: NEW_PASSWORD }],
    ])('rejects %s', async (_case, body) => {
      await changePassword(body).expect(400);

      await login(PASSWORD).expect(200);
    });

    it('requires a session', async () => {
      await api().post('/auth/change-password').send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD }).expect(401);
    });
  });
});
