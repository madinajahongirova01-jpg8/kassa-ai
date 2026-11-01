import { createPgliteDatabase, PgliteDatabase } from '../../test/pglite-database';
import { parseCalendarDate } from '../common/dates';
import { CustomersService } from '../customers/customers.service';
import { DebtsService } from '../debts/debts.service';
import { MESSAGES_EXTRA } from './bot/i18n/messages-extra';
import { PrismaTransactionRepository } from './repositories/prisma-transaction-repository';
import { PrismaUserRepository } from './repositories/prisma-user-repository';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramKassaSync } from './telegram-kassa-sync';
import { TelegramReminderTask } from './telegram-reminder.task';

const TG_A = 7001; // linked to owner A, Russian
const TG_B = 7002; // linked to owner B
const TG_FREE = 7003; // not linked, bot-only nasia
const TG_STOPPED = 7004;

// 04:00 UTC is 09:00 in Dushanbe, when reminders start.
const NOV_1_0859 = new Date('2026-11-01T03:59:00.000Z');
const NOV_1_0900 = new Date('2026-11-01T04:00:00.000Z');
const NOV_1_1500 = new Date('2026-11-01T10:00:00.000Z');
const NOV_2_0000 = new Date('2026-11-01T19:00:00.000Z');
const NOV_2_0900 = new Date('2026-11-02T04:00:00.000Z');

describe('TelegramReminderTask', () => {
  let db: PgliteDatabase;
  let users: PrismaUserRepository;
  let transactions: PrismaTransactionRepository;
  let sent: { chatId: number; text: string }[];
  let bot: { running: boolean; send: jest.Mock<Promise<void>, [number, string]> };
  let task: TelegramReminderTask;
  let ownerA: string;
  let ownerB: string;

  async function account(telegramUserId: number, ownerId: string | null): Promise<number> {
    const { user } = await users.upsertFromTelegram({ telegramUserId, telegramChatId: telegramUserId, firstName: null });
    if (ownerId !== null) {
      await db.prisma.telegramAccount.update({ where: { id: user.id }, data: { userId: ownerId, linkedAt: new Date() } });
    }
    return user.id;
  }

  async function debt(ownerId: string, name: string, amountDirams: number, dueOn: string | null): Promise<void> {
    const customer = await db.prisma.customer.create({ data: { ownerId, name } });
    await db.prisma.debt.create({
      data: {
        ownerId,
        customerId: customer.id,
        amountDirams,
        description: 'nasia',
        occurredOn: parseCalendarDate('2026-09-01'),
        dueOn: dueOn === null ? null : parseCalendarDate(dueOn),
      },
    });
  }

  function sentTo(chatId: number): string[] {
    return sent.filter((message) => message.chatId === chatId).map((message) => message.text);
  }

  beforeAll(async () => {
    db = await createPgliteDatabase();
    users = new PrismaUserRepository(db.prisma);
    transactions = new PrismaTransactionRepository(db.prisma, new TelegramKassaSync(new DebtsService(db.prisma, new CustomersService(db.prisma))));
  }, 60_000);

  beforeEach(async () => {
    await db.reset();
    sent = [];
    bot = {
      running: true,
      send: jest.fn((chatId: number, text: string) => {
        sent.push({ chatId, text });
        return Promise.resolve();
      }),
    };
    task = new TelegramReminderTask(users, transactions, bot as unknown as TelegramBotService);

    ownerA = (await db.prisma.user.create({ data: { email: 'a@example.com', passwordHash: 'x' } })).id;
    ownerB = (await db.prisma.user.create({ data: { email: 'b@example.com', passwordHash: 'x' } })).id;
    await account(TG_A, ownerA);
    await users.setLanguage(TG_A, 'ru');
    await account(TG_B, ownerB);
    const free = await account(TG_FREE, null);
    await account(TG_STOPPED, null);
    await users.setStatus(TG_STOPPED, 'stopped');

    await debt(ownerA, 'Alisher', 12_000, '2026-10-20'); // overdue
    await debt(ownerA, 'Vali', 8_000, '2026-11-30'); // not yet due
    await debt(ownerA, 'NoDate', 5_000, null); // never overdue, like on the website
    await debt(ownerA, 'DueToday', 3_000, '2026-11-01'); // due today: overdue only from 2 November
    await debt(ownerB, 'Zafar', 40_000, '2026-10-01'); // overdue, but owner B's

    const nasia = await transactions.createPending(free, { type: 'credit_sale', amountDiram: 7_000, description: 'nasia', customerName: 'Bobo' });
    await db.prisma.telegramTransaction.update({ where: { id: nasia.id }, data: { occurredAt: new Date('2026-09-01T07:00:00.000Z') } });
    await transactions.resolvePending(nasia.id, free, 'confirmed'); // bot-only, due 2026-10-01
  });

  afterAll(async () => {
    await db.close();
  });

  it("sends each owner only their own overdue debts, in their language, to their own chat", async () => {
    expect(await task.run(NOV_1_0900)).toBe(3);

    const [toA] = sentTo(TG_A);
    expect(toA).toContain('Долги с истёкшим сроком');
    expect(toA).toContain('Alisher');
    for (const other of ['Vali', 'NoDate', 'DueToday', 'Zafar', 'Bobo']) {
      expect(toA).not.toContain(other);
    }
    const [toB] = sentTo(TG_B);
    expect(toB).toContain('Zafar');
    expect(toB).not.toContain('Alisher');
    const [toFree] = sentTo(TG_FREE);
    expect(toFree).toContain('Bobo');
    expect(toFree).toBe(MESSAGES_EXTRA.tg.reminder('• Bobo: 70 сомонӣ', '70 сомонӣ'));

    // Only the owners' own chats; a stopped chat gets nothing.
    expect(new Set(sent.map((message) => message.chatId))).toEqual(new Set([TG_A, TG_B, TG_FREE]));
  });

  it('sends nothing before 09:00 in Dushanbe and does not use up the day', async () => {
    expect(await task.run(NOV_1_0859)).toBe(0);
    expect(await db.prisma.telegramAccount.count({ where: { lastReminderOn: { not: null } } })).toBe(0);
    expect(await task.run(NOV_1_0900)).toBe(3);
  });

  it('sends at most one reminder per account and Dushanbe day, then again the next day', async () => {
    await task.run(NOV_1_0900);
    expect(await task.run(NOV_1_1500)).toBe(0);
    // Midnight in Dushanbe is a new day, but reminders wait until 09:00.
    expect(await task.run(NOV_2_0000)).toBe(0);

    sent = [];
    expect(await task.run(NOV_2_0900)).toBe(3);
    // A debt due on 1 November becomes overdue on 2 November in Dushanbe.
    expect(sentTo(TG_A)[0]).toContain('DueToday');
  });

  it('never sends twice when two runs overlap', async () => {
    const results = await Promise.all([task.run(NOV_1_0900), task.run(NOV_1_0900)]);
    expect(results.sort()).toEqual([0, 3]);
    expect(sent).toHaveLength(3);
  });

  it('does nothing while the bot is off', async () => {
    bot.running = false;
    expect(await task.run(NOV_1_0900)).toBe(0);
    expect(bot.send).not.toHaveBeenCalled();
    expect(await db.prisma.telegramAccount.count({ where: { lastReminderOn: { not: null } } })).toBe(0);
  });

  it('keeps reminding the other owners when sending to one chat fails', async () => {
    bot.send.mockImplementation((chatId: number, text: string) => {
      if (chatId === TG_A) {
        return Promise.reject(new Error('Forbidden: bot was blocked by the user'));
      }
      sent.push({ chatId, text });
      return Promise.resolve();
    });
    const errors = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(await task.run(NOV_1_0900)).toBe(2);
    expect(new Set(sent.map((message) => message.chatId))).toEqual(new Set([TG_B, TG_FREE]));
    errors.mockRestore();
  });
});
