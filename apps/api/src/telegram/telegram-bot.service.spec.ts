import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GrammyError } from 'grammy';
import { Env } from '../config/env';
import { PrismaLinkRepository } from './repositories/prisma-link-repository';
import { PrismaTransactionRepository } from './repositories/prisma-transaction-repository';
import { PrismaUserRepository } from './repositories/prisma-user-repository';
import { createTelegramBot } from './telegram-bot';
import { CONFLICT_RETRY_MS, isTelegramBotToken, TelegramBotService } from './telegram-bot.service';

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

  it.each([
    ['with quotes', '"123456:ABC-def"'],
    ['with a space inside', '123456:ABC def'],
    ['without the numeric part', 'ABC-def_789'],
    ['without the secret part', '123456:'],
    ['with other characters', '123456:ABC/def+ghi='],
  ])('stays off with a malformed token (%s) and logs a clear error without the token', (_label, malformed) => {
    const bot = service({ NODE_ENV: 'production', TELEGRAM_BOT_TOKEN: malformed });
    bot.onApplicationBootstrap();

    expect(bot.running).toBe(false);
    expect(createTelegramBot).not.toHaveBeenCalled();
    const logged = errorLog.mock.calls.flat().join(' ');
    expect(logged).toContain('TELEGRAM_BOT_TOKEN is malformed');
    expect(logged).toContain('The rest of the API keeps running');
    expect(logged).not.toContain(malformed);
  });

  it('accepts the shape of a real @BotFather token', () => {
    expect(isTelegramBotToken('1234567890:AAH-abc_DEF123ghiJKL456mnoPQR789stu')).toBe(true);
    expect(isTelegramBotToken(TOKEN)).toBe(true);
  });

  it('turns only the bot off when Telegram rejects a well-formed token (401), without logging it', async () => {
    fakeBot.start.mockReturnValue(Promise.reject(telegramError(401, 'Unauthorized')));
    const bot = service({ NODE_ENV: 'production', TELEGRAM_BOT_TOKEN: TOKEN });
    bot.onApplicationBootstrap();
    await flush();

    expect(bot.running).toBe(false);
    const logged = errorLog.mock.calls.flat().join(' ');
    expect(logged).toContain('Telegram rejected TELEGRAM_BOT_TOKEN (401 Unauthorized)');
    expect(logged).not.toContain(TOKEN);
    await expect(bot.send(1, 'hi')).rejects.toThrow('Telegram bot is not running');
  });

  it('turns the bot off on another fatal polling error', async () => {
    fakeBot.start.mockReturnValue(Promise.reject(new Error('boom')));
    const bot = service({ NODE_ENV: 'production', TELEGRAM_BOT_TOKEN: TOKEN });
    bot.onApplicationBootstrap();
    await flush();

    expect(bot.running).toBe(false);
    expect(errorLog.mock.calls.flat().join(' ')).toContain('Telegram bot stopped: boom');
  });

  describe('while another instance polls the same bot (409 Conflict, e.g. during a deploy)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('keeps the bot on and polls again later instead of giving up', async () => {
      fakeBot.start
        .mockReturnValueOnce(Promise.reject(telegramError(409, 'Conflict: terminated by other getUpdates request')))
        .mockReturnValueOnce(new Promise<void>(() => undefined));
      const bot = service({ NODE_ENV: 'production', TELEGRAM_BOT_TOKEN: TOKEN });
      bot.onApplicationBootstrap();
      await flush();

      expect(bot.running).toBe(true);
      expect(fakeBot.start).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(CONFLICT_RETRY_MS);
      expect(fakeBot.start).toHaveBeenCalledTimes(2);
      expect(errorLog).not.toHaveBeenCalled();
    });

    it('does not poll again after shutdown', async () => {
      fakeBot.start.mockReturnValueOnce(Promise.reject(telegramError(409, 'Conflict')));
      fakeBot.isRunning.mockReturnValue(false);
      const bot = service({ NODE_ENV: 'production', TELEGRAM_BOT_TOKEN: TOKEN });
      bot.onApplicationBootstrap();
      await flush();

      await bot.onApplicationShutdown();
      await jest.advanceTimersByTimeAsync(CONFLICT_RETRY_MS * 2);

      expect(fakeBot.start).toHaveBeenCalledTimes(1);
      expect(bot.running).toBe(false);
    });
  });
});

function telegramError(code: number, description: string): GrammyError {
  return new GrammyError(`Call to 'getUpdates' failed! (${code}: ${description})`, { ok: false, error_code: code, description }, 'getUpdates', {});
}

/** Lets the rejected start() promise reach its catch handler. */
async function flush(): Promise<void> {
  for (let i = 0; i < 3; i += 1) {
    await Promise.resolve();
  }
}
