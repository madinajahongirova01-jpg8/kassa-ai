import type { Context, MiddlewareFn } from 'grammy';
import { MESSAGES_EXTRA } from './bot/i18n/messages-extra';
import type { UserService } from './bot/services/user-service';

/** Updates (messages and button presses) one chat may send per window; a person typing never gets close. */
export const CHAT_RATE_LIMIT = 20;
export const CHAT_RATE_WINDOW_MS = 60_000;
/** Above this many tracked chats, finished windows are dropped so memory stays bounded. */
const PRUNE_ABOVE = 10_000;

export type RateVerdict = 'allow' | 'warn' | 'drop';

/**
 * Fixed-window counter per chat, kept in memory: the bot runs in one API process, and losing the
 * counters on a restart only gives a flooding chat a fresh minute.
 */
export class ChatRateLimiter {
  private readonly windows = new Map<number, { start: number; count: number }>();

  constructor(
    private readonly limit = CHAT_RATE_LIMIT,
    private readonly windowMs = CHAT_RATE_WINDOW_MS,
  ) {}

  /** 'warn' is the first refused update of a window (the chat is told once), 'drop' the rest. */
  hit(chatId: number, now: number = Date.now()): RateVerdict {
    let window = this.windows.get(chatId);
    if (window === undefined || now - window.start >= this.windowMs) {
      if (window === undefined && this.windows.size >= PRUNE_ABOVE) {
        this.prune(now);
      }
      window = { start: now, count: 0 };
      this.windows.set(chatId, window);
    }
    window.count += 1;
    if (window.count <= this.limit) {
      return 'allow';
    }
    return window.count === this.limit + 1 ? 'warn' : 'drop';
  }

  get trackedChats(): number {
    return this.windows.size;
  }

  private prune(now: number): void {
    for (const [chatId, window] of this.windows) {
      if (now - window.start >= this.windowMs) {
        this.windows.delete(chatId);
      }
    }
  }
}

/**
 * First middleware of the bot: a chat over the limit is not handled, so it cannot fill the
 * database with drafts. It is told once per window in its language; later updates are ignored,
 * except that button presses are always answered so the button stops spinning.
 */
export function chatRateLimit(limiter: ChatRateLimiter, users: UserService): MiddlewareFn<Context> {
  return async (ctx, next) => {
    const chatId = ctx.chat?.id ?? ctx.from?.id;
    if (chatId === undefined) {
      return next();
    }
    const verdict = limiter.hit(chatId);
    if (verdict === 'allow') {
      return next();
    }
    try {
      if (ctx.callbackQuery !== undefined) {
        const text = verdict === 'warn' ? await tooManyText(ctx, users) : undefined;
        await ctx.answerCallbackQuery(text === undefined ? undefined : { text });
      } else if (verdict === 'warn' && ctx.chat?.type === 'private') {
        await ctx.reply(await tooManyText(ctx, users));
      }
    } catch {
      // Telegram or the database is unreachable: the update is dropped either way.
    }
  };
}

async function tooManyText(ctx: Context, users: UserService): Promise<string> {
  const lang = ctx.from === undefined ? null : await users.getLanguage(ctx.from.id);
  return MESSAGES_EXTRA[lang ?? 'tg'].tooManyMessages;
}
