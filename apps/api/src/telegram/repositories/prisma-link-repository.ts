import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { TelegramAccountStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { LinkRepository } from '../bot/repositories/link-repository';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

export type TelegramLinkConflict = 'telegram-account-linked' | 'kassa-user-linked';

/**
 * A valid code that cannot be used because one side is already linked elsewhere. Thrown inside the
 * linking transaction, so the code is not consumed and nothing changes.
 */
export class TelegramLinkConflictError extends Error {
  constructor(readonly reason: TelegramLinkConflict) {
    super(`Telegram link conflict: ${reason}`);
    this.name = 'TelegramLinkConflictError';
  }
}

@Injectable()
export class PrismaLinkRepository implements LinkRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Stores a new code hash for the account and voids its earlier unused codes. createdAt comes from
   * the same clock as expiresAt: the column default would use the database session time zone.
   */
  async createCode(userId: number, codeHash: string, expiresAt: Date): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.telegramLinkCode.updateMany({ where: { accountId: userId, usedAt: null }, data: { usedAt: now } });
      await tx.telegramLinkCode.create({ data: { accountId: userId, codeHash, expiresAt, createdAt: now } });
    });
  }

  /**
   * Links the Telegram account that owns the code to the Kassa user externalAccountId and returns
   * the account id, or null when the code is unknown, expired, already used or its chat is stopped.
   * The code is claimed by a conditional UPDATE, so of two concurrent calls only one can succeed.
   * Linking never replaces an existing link: if the Telegram account belongs to another Kassa user,
   * or the Kassa user already has another Telegram account, TelegramLinkConflictError is thrown.
   * Linking the same pair again is allowed.
   */
  async consume(codeHash: string, externalAccountId: string, now: Date): Promise<number | null> {
    return this.prisma.$transaction(async (tx) => {
      const code = await tx.telegramLinkCode.findUnique({ where: { codeHash }, select: { id: true, accountId: true } });
      if (code === null) {
        return null;
      }

      const claimed = await tx.telegramLinkCode.updateMany({
        where: {
          id: code.id,
          usedAt: null,
          expiresAt: { gt: now },
          account: { status: TelegramAccountStatus.ACTIVE },
        },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) {
        return null;
      }

      const account = await tx.telegramAccount.findUniqueOrThrow({ where: { id: code.accountId }, select: { userId: true } });
      if (account.userId !== null && account.userId !== externalAccountId) {
        throw new TelegramLinkConflictError('telegram-account-linked');
      }
      const other = await tx.telegramAccount.findFirst({
        where: { userId: externalAccountId, id: { not: code.accountId } },
        select: { id: true },
      });
      if (other !== null) {
        throw new TelegramLinkConflictError('kassa-user-linked');
      }

      try {
        await tx.telegramAccount.update({ where: { id: code.accountId }, data: { userId: externalAccountId, linkedAt: now } });
      } catch (error) {
        // Another Telegram account was linked to this Kassa user concurrently (unique user_id).
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_CONSTRAINT_VIOLATION) {
          throw new TelegramLinkConflictError('kassa-user-linked');
        }
        throw error;
      }
      return code.accountId;
    });
  }
}
