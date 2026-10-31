import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { configureApp } from '../app.setup';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EntriesParserService } from './entries-parser.service';
import { EntriesController } from './entries.controller';
import { GeminiClient } from './gemini.client';
import { ParseThrottlerGuard } from './parse-throttler.guard';

const LIMIT = 3;

const fakeAuth = {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: { id: string } }>();
    const id = req.headers['x-test-user'];
    if (id === undefined) throw new UnauthorizedException('Missing or invalid access token');
    req.user = { id };
    return true;
  },
};

describe('POST /entries/parse', () => {
  let app: NestExpressApplication;
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeEach(async () => {
    fetchMock = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('real network requests are not allowed in tests'));
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot({ errorMessage: 'Too many attempts, try again later', throttlers: [{ limit: 1000, ttl: 60_000 }] })],
      controllers: [EntriesController],
      providers: [
        EntriesParserService,
        GeminiClient,
        ParseThrottlerGuard,
        {
          provide: ConfigService,
          useValue: new ConfigService({
            TRUST_PROXY: ['loopback'],
            GEMINI_API_KEY: undefined,
            GEMINI_MODEL: 'gemini-3.5-flash-lite',
            ENTRY_PARSE_THROTTLE_LIMIT: LIMIT,
            ENTRY_PARSE_THROTTLE_TTL_SECONDS: 60,
          }),
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(fakeAuth)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.useLogger(false);
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  function parse(user: string | undefined, body: object): request.Test {
    const pending = request(app.getHttpServer()).post('/entries/parse');
    return (user === undefined ? pending : pending.set('X-Test-User', user)).send(body);
  }

  it('requires sign-in', async () => {
    await parse(undefined, { text: 'продажа 500' }).expect(401);
  });

  it('parses with the rules while AI has no key', async () => {
    const response = await parse('owner', { text: 'продажа 500, такси 30' }).expect(200);

    expect(response.body).toEqual({
      source: 'rules',
      entries: [
        { kind: 'income', category: 'SALE', title: 'Продажа', amountDirams: 50_000 },
        { kind: 'expense', category: 'TRANSPORT', title: 'Такси', amountDirams: 3_000 },
      ],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['an empty text', { text: '   ' }],
    ['a missing text', {}],
    ['a text that is too long', { text: 'а'.repeat(1001) }],
    ['a text that is not a string', { text: 500 }],
  ])('rejects %s with 400', async (_case, body) => {
    await parse('owner', body).expect(400);
  });

  it('answers 429 once one user exceeds the limit, without blocking another user', async () => {
    for (let attempt = 0; attempt < LIMIT; attempt += 1) {
      await parse('busy-user', { text: 'такси 30' }).expect(200);
    }

    const blocked = await parse('busy-user', { text: 'такси 30' }).expect(429);
    expect(blocked.body).toMatchObject({ statusCode: 429 });
    await parse('other-user', { text: 'такси 30' }).expect(200);
  });
});
