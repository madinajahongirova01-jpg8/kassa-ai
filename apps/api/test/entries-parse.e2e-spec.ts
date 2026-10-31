import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Entry text parsing (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let token: string;
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.useLogger(false);
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    fetchMock = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('real network requests are not allowed in tests'));
    await prisma.user.deleteMany();
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'owner@example.com', password: 'correct-horse-battery', businessName: 'Test shop' })
      .expect(201);
    token = (response.body as { accessToken: string }).accessToken;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it('requires a valid token', async () => {
    await request(app.getHttpServer()).post('/entries/parse').send({ text: 'продажа 500' }).expect(401);
  });

  it('parses mixed text with the rules when no Gemini key is set, and saves nothing', async () => {
    const response = await request(app.getHttpServer())
      .post('/entries/parse')
      .auth(token, { type: 'bearer' })
      .send({ text: 'Фурӯш 1800, такси 30, Раҳим 120 насия гирифт' })
      .expect(200);

    expect(response.body).toEqual({
      source: 'rules',
      entries: [
        { kind: 'income', category: 'SALE', title: 'Фурӯш', amountDirams: 180_000 },
        { kind: 'expense', category: 'TRANSPORT', title: 'Такси', amountDirams: 3_000 },
        { kind: 'debt', category: 'OTHER', title: 'Раҳим насия гирифт', amountDirams: 12_000 },
      ],
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await prisma.cashEntry.count()).toBe(0);
    expect(await prisma.debt.count()).toBe(0);
  });
});
