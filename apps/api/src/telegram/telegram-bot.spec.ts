import type { Bot } from 'grammy';
import type { Update, UserFromGetMe } from 'grammy/types';
import { createPgliteDatabase, PgliteDatabase } from '../../test/pglite-database';
import { CustomersService } from '../customers/customers.service';
import { DebtsService } from '../debts/debts.service';
import { MESSAGES_EXTRA } from './bot/i18n/messages-extra';
import { LinkService } from './bot/services/link-service';
import { TransactionService } from './bot/services/transaction-service';
import { UserService } from './bot/services/user-service';
import { PrismaLinkRepository } from './repositories/prisma-link-repository';
import { PrismaTransactionRepository } from './repositories/prisma-transaction-repository';
import { PrismaUserRepository } from './repositories/prisma-user-repository';
import { botErrorMessage, createTelegramBot } from './telegram-bot';
import { TelegramKassaSync, TelegramSyncError } from './telegram-kassa-sync';

const BOT_INFO: UserFromGetMe = {
  id: 42,
  is_bot: true,
  first_name: 'Kassa AI',
  username: 'kassa_ai_test_bot',
  can_join_groups: false,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
  can_connect_to_business: false,
  has_main_web_app: false,
  has_topics_enabled: false,
  allows_users_to_create_topics: false,
} as UserFromGetMe;
const OWNER = 5001;

interface ApiCall {
  method: string;
  payload: Record<string, unknown>;
}

describe('Telegram bot running in the API', () => {
  let db: PgliteDatabase;
  let users: PrismaUserRepository;
  let bot: Bot;
  let calls: ApiCall[];
  let ownerId: string;
  let updateId = 0;

  async function handle(update: Omit<Update, 'update_id'>): Promise<void> {
    updateId += 1;
    // What the polling loop does: errors of a handler go to the handler set by bot.catch.
    await bot.handleUpdate({ update_id: updateId, ...update }).catch((error: Parameters<Bot['errorHandler']>[0]) => bot.errorHandler(error));
  }

  function text(message: string): Promise<void> {
    return handle({
      message: {
        message_id: updateId,
        date: 0,
        chat: { id: OWNER, type: 'private', first_name: 'Aziz' },
        from: { id: OWNER, is_bot: false, first_name: 'Aziz' },
        text: message,
      },
    });
  }

  function press(data: string): Promise<void> {
    return handle({
      callback_query: {
        id: `cb${updateId}`,
        chat_instance: 'chat',
        from: { id: OWNER, is_bot: false, first_name: 'Aziz' },
        message: { message_id: 1, date: 0, chat: { id: OWNER, type: 'private', first_name: 'Aziz' }, text: 'receipt' },
        data,
      },
    });
  }

  async function lastDraftId(): Promise<number> {
    return (await db.prisma.telegramTransaction.findFirstOrThrow({ orderBy: { id: 'desc' } })).id;
  }

  beforeAll(async () => {
    db = await createPgliteDatabase();
    users = new PrismaUserRepository(db.prisma);
    const transactions = new PrismaTransactionRepository(
      db.prisma,
      new TelegramKassaSync(new DebtsService(db.prisma, new CustomersService(db.prisma))),
    );
    bot = createTelegramBot(
      '123456:TEST-token-never-sent',
      {
        userService: new UserService(users),
        transactionService: new TransactionService(users, transactions),
        linkService: new LinkService(users, new PrismaLinkRepository(db.prisma)),
      },
      BOT_INFO,
    );
    // Records every Bot API call instead of sending it.
    bot.api.config.use((_prev, method, payload) => {
      calls.push({ method, payload: payload });
      return Promise.resolve({ ok: true, result: true } as never);
    });
  }, 60_000);

  beforeEach(async () => {
    await db.reset();
    calls = [];
    ownerId = (await db.prisma.user.create({ data: { email: 'owner@example.com', passwordHash: 'x' } })).id;
    const { user } = await users.upsertFromTelegram({ telegramUserId: OWNER, telegramChatId: OWNER, firstName: 'Aziz' });
    await users.setLanguage(OWNER, 'ru');
    await db.prisma.telegramAccount.update({ where: { id: user.id }, data: { userId: ownerId, linkedAt: new Date() } });
  });

  afterAll(async () => {
    await db.close();
  });

  it('confirms a sale through the real handlers and writes it to Kassa', async () => {
    await text('продажа 150');
    expect(calls.map((call) => call.method)).toEqual(['sendMessage']);

    await press(`tx:confirm:${await lastDraftId()}`);

    expect(calls.map((call) => call.method)).toEqual(['sendMessage', 'answerCallbackQuery', 'editMessageText']);
    expect(await db.prisma.cashEntry.findFirstOrThrow()).toMatchObject({ ownerId, amountDirams: 15_000 });
  });

  it('tells the owner in their language why a debt payment was not saved, and keeps the buttons usable', async () => {
    await text('Ali вернул 50');
    const draftId = await lastDraftId();

    await press(`tx:confirm:${draftId}`);

    expect(calls.at(-1)).toEqual({
      method: 'answerCallbackQuery',
      payload: expect.objectContaining({ text: MESSAGES_EXTRA.ru.customerNotFound, show_alert: true }) as unknown,
    });
    expect((await db.prisma.telegramTransaction.findUniqueOrThrow({ where: { id: draftId } })).status).toBe('PENDING');
    expect(calls.some((call) => call.method === 'editMessageText')).toBe(false);

    await press(`tx:cancel:${draftId}`);
    expect((await db.prisma.telegramTransaction.findUniqueOrThrow({ where: { id: draftId } })).status).toBe('CANCELLED');
  });

  it('replies when an amount is above the Kassa limit and saves nothing', async () => {
    await text('продажа 99999999999');

    expect(calls).toEqual([
      { method: 'sendMessage', payload: expect.objectContaining({ chat_id: OWNER, text: MESSAGES_EXTRA.ru.amountTooLarge }) as unknown },
    ]);
    expect(await db.prisma.telegramTransaction.count()).toBe(0);
  });

  it('maps every refusal to its own message and anything unexpected to a generic one', () => {
    expect(botErrorMessage(new TelegramSyncError('customer-ambiguous'), 'tg')).toBe(MESSAGES_EXTRA.tg.customerAmbiguous);
    expect(botErrorMessage(new TelegramSyncError('no-open-debts'), 'en')).toBe(MESSAGES_EXTRA.en.noOpenDebts);
    expect(botErrorMessage(new TelegramSyncError('exceeds-debt', 12_550), 'ru')).toBe(MESSAGES_EXTRA.ru.exceedsDebt('125.50 сомони'));
    expect(botErrorMessage(new Error('connection reset'), 'tg')).toBe(MESSAGES_EXTRA.tg.saveFailed);
  });

  it('keeps every error message short enough for a Telegram alert', () => {
    for (const messages of Object.values(MESSAGES_EXTRA)) {
      const texts = [
        messages.customerNotFound,
        messages.customerAmbiguous,
        messages.noOpenDebts,
        messages.exceedsDebt('10 000 000 сомонӣ'),
        messages.amountTooLarge,
        messages.saveFailed,
      ];
      expect(texts.every((value) => value.length > 0 && value.length <= 200)).toBe(true);
    }
  });
});
