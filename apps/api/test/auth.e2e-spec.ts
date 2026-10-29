import { NestExpressApplication } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ErrorResponse } from '../src/common/error-response';
import { PrismaService } from '../src/prisma/prisma.service';

interface PublicUserBody {
  id: string;
  email: string;
  name: string | null;
  businessName: string | null;
  createdAt: string;
}

interface AuthBody {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: PublicUserBody;
}

const PASSWORD = 'correct-horse-battery';
const BUSINESS = 'Chaikhona Rukh';
const JWT_SECRET = process.env.JWT_SECRET ?? '';

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  function register(body: object): request.Test {
    return request(app.getHttpServer()).post('/auth/register').send(body);
  }

  function login(body: object): request.Test {
    return request(app.getHttpServer()).post('/auth/login').send(body);
  }

  function me(authorization?: string): request.Test {
    const req = request(app.getHttpServer()).get('/auth/me');
    return authorization === undefined ? req : req.set('Authorization', authorization);
  }

  function expectNoSensitiveData(body: unknown): void {
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain(PASSWORD);
    expect(serialized).not.toMatch(/passwordHash|password_hash|\$argon2/);
    expect(serialized).not.toContain(JWT_SECRET);
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
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('creates a user, hashes the password and returns a token', async () => {
      const response = await register({ email: '  Owner@Example.COM ', password: PASSWORD, businessName: '  Chaikhona Rukh ', name: ' Madina ' }).expect(201);
      const body = response.body as AuthBody;

      expect(body.tokenType).toBe('Bearer');
      expect(body.expiresIn).toBe(3600);
      expect(typeof body.accessToken).toBe('string');
      expect(body.user).toEqual({
        id: expect.any(String) as string,
        email: 'owner@example.com',
        name: 'Madina',
        businessName: BUSINESS,
        createdAt: expect.any(String) as string,
      });
      expectNoSensitiveData(body);

      const stored = await prisma.user.findUniqueOrThrow({ where: { email: 'owner@example.com' } });
      expect(stored.businessName).toBe(BUSINESS);
      expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
      expect(stored.passwordHash).not.toBe(PASSWORD);
    });

    it('allows registration without a name', async () => {
      const response = await register({ email: 'noname@example.com', password: PASSWORD, businessName: BUSINESS }).expect(201);

      expect((response.body as AuthBody).user.name).toBeNull();
    });

    it.each([
      ['an invalid email', { email: 'not-an-email', password: PASSWORD, businessName: BUSINESS }],
      ['a short password', { email: 'owner@example.com', password: 'short', businessName: BUSINESS }],
      ['a too long password', { email: 'owner@example.com', password: 'x'.repeat(129), businessName: BUSINESS }],
      ['a missing password', { email: 'owner@example.com', businessName: BUSINESS }],
      ['a non-string password', { email: 'owner@example.com', password: 12345678, businessName: BUSINESS }],
      ['a missing businessName', { email: 'owner@example.com', password: PASSWORD }],
      ['a blank businessName', { email: 'owner@example.com', password: PASSWORD, businessName: '   ' }],
      ['a too long businessName', { email: 'owner@example.com', password: PASSWORD, businessName: 'x'.repeat(101) }],
      ['a non-string businessName', { email: 'owner@example.com', password: PASSWORD, businessName: 42 }],
      ['an empty name', { email: 'owner@example.com', password: PASSWORD, businessName: BUSINESS, name: '   ' }],
      ['an unknown field', { email: 'owner@example.com', password: PASSWORD, businessName: BUSINESS, role: 'admin' }],
    ])('rejects %s with 400', async (_case, payload) => {
      const response = await register(payload).expect(400);
      const body = response.body as ErrorResponse;

      expect(body).toMatchObject({ statusCode: 400, error: 'Bad Request', message: 'Validation failed' });
      expect(body.details?.length).toBeGreaterThan(0);
      expect(await prisma.user.count()).toBe(0);
    });

    it('rejects a duplicate email regardless of case with 409', async () => {
      await register({ email: 'owner@example.com', password: PASSWORD, businessName: BUSINESS }).expect(201);

      const response = await register({ email: 'OWNER@example.com', password: 'another-password', businessName: BUSINESS }).expect(409);

      expect(response.body).toEqual({
        statusCode: 409,
        error: 'Conflict',
        message: 'An account with this email already exists',
      });
      expect(await prisma.user.count()).toBe(1);
    });

    it('rejects malformed JSON with 400 in the unified error format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"email": "owner@example.com", "password": ')
        .expect(400);

      expect(Object.keys(response.body as object).sort()).toEqual(['error', 'message', 'statusCode']);
      expect(response.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
      expect(JSON.stringify(response.body)).not.toMatch(/stack|node_modules/);
    });

    it('rejects an oversized body with 413 without internal details', async () => {
      const response = await register({ email: 'owner@example.com', password: PASSWORD, businessName: BUSINESS, name: 'x'.repeat(200_000) }).expect(
        413,
      );

      expect(response.body).toEqual({ statusCode: 413, error: 'Payload Too Large', message: 'Malformed request' });
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await register({ email: 'owner@example.com', password: PASSWORD, businessName: BUSINESS }).expect(201);
    });

    it('returns a token for valid credentials', async () => {
      const response = await login({ email: 'Owner@Example.com', password: PASSWORD }).expect(200);
      const body = response.body as AuthBody;

      expect(body.tokenType).toBe('Bearer');
      expect(body.user.email).toBe('owner@example.com');
      expectNoSensitiveData(body);
      await me(`Bearer ${body.accessToken}`).expect(200);
    });

    it('rejects a wrong password with 401', async () => {
      const response = await login({ email: 'owner@example.com', password: 'wrong-password' }).expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      expectNoSensitiveData(response.body);
    });

    it('rejects an unknown email with the same 401 response', async () => {
      const response = await login({ email: 'nobody@example.com', password: PASSWORD }).expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    });

    it('rejects invalid input with 400', async () => {
      const response = await login({ email: 'owner@example.com', password: '' }).expect(400);

      expect((response.body as ErrorResponse).message).toBe('Validation failed');
    });
  });

  describe('GET /auth/me', () => {
    it('returns the current user for a valid token', async () => {
      const registered = (await register({ email: 'owner@example.com', password: PASSWORD, businessName: BUSINESS, name: 'Owner' }).expect(201))
        .body as AuthBody;

      const response = await me(`Bearer ${registered.accessToken}`).expect(200);

      expect(response.body).toEqual({ user: registered.user });
      expect(registered.user.businessName).toBe(BUSINESS);
      expectNoSensitiveData(response.body);
    });

    it('returns a null businessName for a user created before the field existed', async () => {
      const legacy = await prisma.user.create({
        data: { email: 'legacy@example.com', name: 'Legacy', passwordHash: 'not-a-real-hash' },
      });
      const token = await new JwtService({ secret: JWT_SECRET }).signAsync({ sub: legacy.id });

      const response = await me(`Bearer ${token}`).expect(200);

      expect((response.body as { user: PublicUserBody }).user).toMatchObject({ name: 'Legacy', businessName: null });
    });

    it('rejects a request without a token', async () => {
      const response = await me().expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Missing or invalid access token',
      });
    });

    it.each([
      ['a malformed token', 'Bearer not.a.jwt'],
      ['a wrong scheme', 'Basic b3duZXI6cGFzcw=='],
      ['an empty bearer', 'Bearer '],
    ])('rejects %s with 401', async (_case, header) => {
      const response = await me(header).expect(401);

      expect((response.body as ErrorResponse).message).toBe('Missing or invalid access token');
    });

    it('rejects a token signed with another secret', async () => {
      const registered = (await register({ email: 'owner@example.com', password: PASSWORD, businessName: BUSINESS }).expect(201)).body as AuthBody;
      const forged = await new JwtService({ secret: 'attacker-secret-that-is-32-characters-long' }).signAsync({
        sub: registered.user.id,
      });

      await me(`Bearer ${forged}`).expect(401);
    });

    it('rejects an expired token', async () => {
      const registered = (await register({ email: 'owner@example.com', password: PASSWORD, businessName: BUSINESS }).expect(201)).body as AuthBody;
      const expired = await new JwtService({ secret: JWT_SECRET }).signAsync({
        sub: registered.user.id,
        exp: Math.floor(Date.now() / 1000) - 60,
      });

      await me(`Bearer ${expired}`).expect(401);
    });

    it('rejects a valid token of a deleted user', async () => {
      const registered = (await register({ email: 'owner@example.com', password: PASSWORD, businessName: BUSINESS }).expect(201)).body as AuthBody;
      await prisma.user.delete({ where: { id: registered.user.id } });

      await me(`Bearer ${registered.accessToken}`).expect(401);
    });
  });

  describe('unknown routes', () => {
    it('return the unified error format', async () => {
      const response = await request(app.getHttpServer()).get('/does-not-exist').expect(404);

      expect(response.body).toMatchObject({ statusCode: 404, error: 'Not Found' });
    });
  });
});
