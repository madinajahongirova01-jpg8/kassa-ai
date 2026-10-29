import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getOptionsToken, ThrottlerModuleOptions } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ErrorResponse } from '../src/common/error-response';
import { Env } from '../src/config/env';
import { PrismaService } from '../src/prisma/prisma.service';

const LIMIT = 3;
const PASSWORD = 'correct-horse-battery';
const CLIENT_A = '203.0.113.10';
const CLIENT_B = '198.51.100.20';

const throttleOptions: ThrottlerModuleOptions = {
  errorMessage: 'Too many attempts, try again later',
  throttlers: [{ limit: LIMIT, ttl: 60_000 }],
};

describe('Auth rate limiting (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  async function startApp(trustProxy: string[]): Promise<void> {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getOptionsToken())
      .useValue(throttleOptions)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.useLogger(false);
    app.get<ConfigService<Env, true>>(ConfigService).set('TRUST_PROXY', trustProxy);
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.user.deleteMany();
  }

  function login(forwardedFor?: string): request.Test {
    const pending = request(app.getHttpServer()).post('/auth/login');
    const withIp = forwardedFor === undefined ? pending : pending.set('X-Forwarded-For', forwardedFor);
    return withIp.send({ email: 'nobody@example.com', password: PASSWORD });
  }

  afterEach(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('when the connection comes from a trusted proxy', () => {
    beforeEach(() => startApp(['loopback']));

    it('answers 429 once the login limit is exceeded', async () => {
      for (let attempt = 0; attempt < LIMIT; attempt += 1) {
        await login().expect(401);
      }

      const response = await login().expect(429);

      expect(response.body as ErrorResponse).toEqual({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Too many attempts, try again later',
      });
      expect(response.headers['retry-after']).toBeDefined();
    });

    it('answers 429 once the registration limit is exceeded and creates no extra user', async () => {
      for (let attempt = 0; attempt < LIMIT; attempt += 1) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({ email: `owner${attempt}@example.com`, password: PASSWORD, businessName: 'Shop' })
          .expect(201);
      }

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'extra@example.com', password: PASSWORD, businessName: 'Shop' })
        .expect(429);

      expect(await prisma.user.count()).toBe(LIMIT);
    });

    it('counts attempts separately for each forwarded client IP', async () => {
      for (let attempt = 0; attempt < LIMIT; attempt += 1) {
        await login(CLIENT_A).expect(401);
      }
      await login(CLIENT_A).expect(429);

      for (let attempt = 0; attempt < LIMIT; attempt += 1) {
        await login(CLIENT_B).expect(401);
      }
      await login(CLIENT_B).expect(429);
    });

    it('does not limit authenticated data endpoints', async () => {
      for (let attempt = 0; attempt <= LIMIT; attempt += 1) {
        await request(app.getHttpServer()).get('/auth/me').expect(401);
      }
    });
  });

  describe('when the connection comes from an untrusted address', () => {
    beforeEach(() => startApp(['192.0.2.1']));

    it('ignores X-Forwarded-For and limits by the connection address', async () => {
      for (let attempt = 0; attempt < LIMIT; attempt += 1) {
        await login(`203.0.113.${attempt + 1}`).expect(401);
      }

      await login(CLIENT_B).expect(429);
    });
  });
});
