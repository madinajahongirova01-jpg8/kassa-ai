import '../../test/malformed-telegram-token-env';
import { Logger } from '@nestjs/common';
import request from 'supertest';
import { createPgliteApp, PgliteApp } from '../../test/pglite-app';
import { TelegramBotService } from './telegram-bot.service';

const MALFORMED = '"123456:FAKE-token-for-tests"';

describe('API startup with a malformed TELEGRAM_BOT_TOKEN', () => {
  let ctx: PgliteApp;
  let errorLog: jest.SpyInstance;

  beforeAll(async () => {
    errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    ctx = await createPgliteApp();
  }, 60_000);

  afterAll(async () => {
    await ctx.close();
    errorLog.mockRestore();
  });

  it('starts the whole API with the bot off and a safe error in the log', () => {
    expect(process.env.TELEGRAM_BOT_TOKEN).toBe(MALFORMED);
    expect(ctx.app.get(TelegramBotService).running).toBe(false);

    const logged = errorLog.mock.calls.flat().join(' ');
    expect(logged).toContain('TELEGRAM_BOT_TOKEN is malformed');
    expect(logged).not.toContain('FAKE-token-for-tests');
  });

  it('keeps serving the rest of the API', async () => {
    const api = request(ctx.app.getHttpServer());
    await api.get('/health').expect(200, { status: 'ok' });

    const registered = await api
      .post('/auth/register')
      .send({ email: 'owner@example.com', password: 'correct-horse-battery', businessName: 'Shop' })
      .expect(201);
    const token = (registered.body as { accessToken: string }).accessToken;

    await api.get('/customers').auth(token, { type: 'bearer' }).expect(200);
    await api.get('/telegram/link').auth(token, { type: 'bearer' }).expect(200, { linked: false, linkedAt: null });
  });
});
