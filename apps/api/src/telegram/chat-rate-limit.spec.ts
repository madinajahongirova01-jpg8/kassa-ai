import type { Context } from 'grammy';
import { MESSAGES_EXTRA } from './bot/i18n/messages-extra';
import type { UserService } from './bot/services/user-service';
import { CHAT_RATE_LIMIT, CHAT_RATE_WINDOW_MS, ChatRateLimiter, chatRateLimit } from './chat-rate-limit';

describe('ChatRateLimiter', () => {
  it('allows the limit per window, warns once, then drops until the window ends', () => {
    const limiter = new ChatRateLimiter(3, 1000);
    expect([1, 2, 3].map(() => limiter.hit(1, 0))).toEqual(['allow', 'allow', 'allow']);
    expect(limiter.hit(1, 10)).toBe('warn');
    expect(limiter.hit(1, 20)).toBe('drop');
    expect(limiter.hit(1, 999)).toBe('drop');
    expect(limiter.hit(1, 1000)).toBe('allow');
  });

  it('counts every chat on its own', () => {
    const limiter = new ChatRateLimiter(1, 1000);
    expect(limiter.hit(1, 0)).toBe('allow');
    expect(limiter.hit(1, 0)).toBe('warn');
    expect(limiter.hit(2, 0)).toBe('allow');
  });

  it('forgets finished windows when many chats are tracked', () => {
    const limiter = new ChatRateLimiter(5, 1000);
    for (let chat = 0; chat < 10_000; chat += 1) {
      limiter.hit(chat, 0);
    }
    expect(limiter.trackedChats).toBe(10_000);
    limiter.hit(-1, 1000);
    expect(limiter.trackedChats).toBe(1);
  });

  it('leaves room for a normal conversation', () => {
    expect(CHAT_RATE_LIMIT).toBeGreaterThanOrEqual(20);
    expect(CHAT_RATE_WINDOW_MS).toBe(60_000);
  });
});

describe('chatRateLimit middleware', () => {
  const users = { getLanguage: jest.fn(() => Promise.resolve('ru' as const)) } as unknown as UserService;
  const resolved = (): Promise<undefined> => Promise.resolve(undefined);

  function update(extra: Record<string, unknown> = {}): { ctx: Context; reply: jest.Mock; answer: jest.Mock; next: jest.Mock } {
    const reply = jest.fn(resolved);
    const answer = jest.fn(resolved);
    const ctx = { chat: { id: 5, type: 'private' }, from: { id: 5 }, reply, answerCallbackQuery: answer, ...extra } as unknown as Context;
    return { ctx, reply, answer, next: jest.fn(resolved) };
  }

  it('passes updates under the limit to the handlers', async () => {
    const { ctx, reply, next } = update();
    await chatRateLimit(new ChatRateLimiter(2, 60_000), users)(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(reply).not.toHaveBeenCalled();
  });

  it('stops a flooding chat, tells it once in its language and ignores the rest', async () => {
    const middleware = chatRateLimit(new ChatRateLimiter(1, 60_000), users);
    const { ctx, reply, next } = update();

    for (let i = 0; i < 4; i += 1) {
      await middleware(ctx, next);
    }

    expect(next).toHaveBeenCalledTimes(1);
    expect(reply.mock.calls).toEqual([[MESSAGES_EXTRA.ru.tooManyMessages]]);
  });

  it('always answers a refused button press so it stops spinning', async () => {
    const middleware = chatRateLimit(new ChatRateLimiter(0, 60_000), users);
    const { ctx, answer, next } = update({ callbackQuery: { id: 'cb' } });

    await middleware(ctx, next);
    await middleware(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(answer.mock.calls).toEqual([[{ text: MESSAGES_EXTRA.ru.tooManyMessages }], [undefined]]);
  });

  it('drops the update quietly when Telegram cannot be reached', async () => {
    const middleware = chatRateLimit(new ChatRateLimiter(0, 60_000), users);
    const { ctx, reply, next } = update();
    reply.mockRejectedValueOnce(new Error('network'));
    await expect(middleware(ctx, next)).resolves.toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });
});
