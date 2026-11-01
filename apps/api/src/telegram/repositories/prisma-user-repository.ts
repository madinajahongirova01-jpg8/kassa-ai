import { Injectable } from '@nestjs/common';
import { parseCalendarDate } from '../../common/dates';
import { TelegramAccount } from '../../generated/prisma/client';
import { TelegramAccountStatus, TelegramLanguage } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { RegisterUserInput, UserRepository } from '../bot/repositories/user-repository';
import type { Lang } from '../bot/types/language';
import type { User } from '../bot/types/user';

const LANGUAGE_TO_DB: Record<Lang, TelegramLanguage> = {
  tg: TelegramLanguage.TG,
  ru: TelegramLanguage.RU,
  en: TelegramLanguage.EN,
};

const LANGUAGE_FROM_DB: Record<TelegramLanguage, Lang> = {
  [TelegramLanguage.TG]: 'tg',
  [TelegramLanguage.RU]: 'ru',
  [TelegramLanguage.EN]: 'en',
};

export function toBotUser(account: TelegramAccount): User {
  return {
    id: account.id,
    telegramUserId: Number(account.telegramUserId),
    telegramChatId: Number(account.telegramChatId),
    firstName: account.firstName,
    status: account.status === TelegramAccountStatus.ACTIVE ? 'active' : 'stopped',
    language: account.language === null ? null : LANGUAGE_FROM_DB[account.language],
  };
}

/** Accounts not reminded yet on the given Dushanbe calendar day ("YYYY-MM-DD"). */
function notRemindedOn(date: string): { OR: ({ lastReminderOn: null } | { lastReminderOn: { lt: Date } })[] } {
  return { OR: [{ lastReminderOn: null }, { lastReminderOn: { lt: parseCalendarDate(date) } }] };
}

// Every query is scoped by the Telegram user id or the internal account id given by the caller.
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromTelegram(input: RegisterUserInput): Promise<{ user: User; isNew: boolean }> {
    const telegramUserId = BigInt(input.telegramUserId);
    const existing = await this.prisma.telegramAccount.findUnique({ where: { telegramUserId }, select: { id: true } });
    const account = await this.prisma.telegramAccount.upsert({
      where: { telegramUserId },
      create: { telegramUserId, telegramChatId: BigInt(input.telegramChatId), firstName: input.firstName },
      update: {
        telegramChatId: BigInt(input.telegramChatId),
        firstName: input.firstName,
        status: TelegramAccountStatus.ACTIVE,
      },
    });
    return { user: toBotUser(account), isNew: existing === null };
  }

  async findByTelegramUserId(telegramUserId: number): Promise<User | null> {
    const account = await this.prisma.telegramAccount.findUnique({ where: { telegramUserId: BigInt(telegramUserId) } });
    return account === null ? null : toBotUser(account);
  }

  async setLanguage(telegramUserId: number, language: Lang): Promise<User | null> {
    const where = { telegramUserId: BigInt(telegramUserId) };
    const { count } = await this.prisma.telegramAccount.updateMany({ where, data: { language: LANGUAGE_TO_DB[language] } });
    return count === 0 ? null : this.findByTelegramUserId(telegramUserId);
  }

  /**
   * Stopping also unlinks the account from Kassa and voids its unused link codes, so a stopped
   * chat can no longer write to or read from a Kassa account until it is linked again.
   */
  async setStatus(telegramUserId: number, status: 'active' | 'stopped'): Promise<User | null> {
    const where = { telegramUserId: BigInt(telegramUserId) };
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.telegramAccount.updateMany({
        where,
        data:
          status === 'stopped'
            ? { status: TelegramAccountStatus.STOPPED, userId: null, linkedAt: null }
            : { status: TelegramAccountStatus.ACTIVE },
      });
      if (count === 0) {
        return null;
      }
      const account = await tx.telegramAccount.findUniqueOrThrow({ where });
      if (status === 'stopped') {
        await tx.telegramLinkCode.updateMany({ where: { accountId: account.id, usedAt: null }, data: { usedAt: new Date() } });
      }
      return toBotUser(account);
    });
  }

  async listDueForReminder(date: string): Promise<User[]> {
    const accounts = await this.prisma.telegramAccount.findMany({
      where: { status: TelegramAccountStatus.ACTIVE, ...notRemindedOn(date) },
      orderBy: { id: 'asc' },
    });
    return accounts.map(toBotUser);
  }

  /** Atomically marks today's reminder as taken; only one caller per account and day gets true. */
  async claimReminder(userId: number, date: string): Promise<boolean> {
    const { count } = await this.prisma.telegramAccount.updateMany({
      where: { id: userId, status: TelegramAccountStatus.ACTIVE, ...notRemindedOn(date) },
      data: { lastReminderOn: parseCalendarDate(date) },
    });
    return count === 1;
  }
}
