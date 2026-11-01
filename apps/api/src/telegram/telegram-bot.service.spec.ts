import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env';
import { PrismaLinkRepository } from './repositories/prisma-link-repository';
import { PrismaTransactionRepository } from './repositories/prisma-transaction-repository';
import { PrismaUserRepository } from './repositories/prisma-user-repository';
import { createTelegramBot } from './telegram-bot';
import { TelegramBotService } from './telegram-bot.service';

jest.mock('./telegram-bot', () => ({ createTelegramBot: jest.fn() }));

const TOKEN = '123456:TEST-token-never-sent';

describe('TelegramBotService', () => {
  let fakeBot: { start: jest.Mock; stop: jest.Mock; isRunning: jest.Mock; api: { sendMessage: jest.Mock } };
  let stopPolling: () => void;
  let errorLog: jest.SpyInstance;

  function service(env: Partial<Env>): TelegramBotService {
    const config = { get: (key: keyof Env) => env[key] } as unknown as ConfigService<Env, true>;
    return new TelegramBotService(
      config,
      {} as PrismaUserRepository,
      {} as PrismaTransactionRepository,
      {} as PrismaLinkRepository,
    );
  }

  beforeEach(() => {
    fakeBot = {
      start: jest.fn(() => new Promise<void>((resolve) => (stopPolling = resolve))),
      stop: jest.fn(() => {
        stopPolling();
        return Promise.resolve();
      }),
      isRunning: jest.fn(() => true),
      api: { sendMessage: jest.fn(() => Promise.resolve()) },
    };
    jest.mocked(createTelegramBot).mockReset().mockReturnValue(fakeBot as never);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stays off without a token, and can not send', async () => {
    const bot = service({ NODE_ENV: 'production', TELEGRAM_BOT_TOKEN: undefined });
    bot.onApplicationBootstrap();

    expect(bot.running).toBe(false);
    expect(createTelegramBot).not.toHaveBeenCalled();
    await expect(bot.send(1, 'hi')).rejects.toThrow('Telegram bot is not running');
  });

  it('stays off in tests even with a token', () => {
    const bot = service({ NODE_ENV: 'test', TELEGRAM_BOT_TOKEN: TOKEN });
    bot.onApplicationBootstrap();

    expect(bot.running).toBe(false);
    expect(createTelegramBot).not.toHaveBeenCalled();
  });

  it('starts long polling with the token, sends through the bot and stops on shutdown', async () => {
    const bot = service({ NODE_ENV: 'production', TELEGRAM_BOT_TOKEN: TOKEN });
    bot.onApplicationBootstrap();

    expect(createTelegramBot).toHaveBeenCalledWith(TOKEN, bot.deps);
    expect(fakeBot.start).toHaveBeenCalledTimes(1);
    expect(bot.running).toBe(true);

    await bot.send(777, 'reminder');
    expect(fakeBot.api.sendMessage).toHaveBeenCalledWith(777, 'reminder');

    await bot.onApplicationShutdown();
    expect(fakeBot.stop).toHaveBeenCalledTimes(1);
    expect(bot.running).toBe(false);
  });

  it('marks itself off when polling fails, for example with a revoked token', async () => {
    fakeBot.start.mockReturnValue(Promise.reject(new Error('Call to getMe failed! (401: Unauthorized)')));
    const bot = service({ NODE_ENV: 'production', TELEGRAM_BOT_TOKEN: TOKEN });
    bot.onApplicationBootstrap();
    await new Promise((resolve) => setImmediate(resolve));

    expect(bot.running).toBe(false);
    const logged = errorLog.mock.calls.flat().join(' ');
    expect(logged).toContain('Telegram bot stopped');
    expect(logged).not.toContain(TOKEN);
  });
});
