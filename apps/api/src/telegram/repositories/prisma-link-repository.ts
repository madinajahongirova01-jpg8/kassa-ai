import { Injectable } from '@nestjs/common';
import { TelegramAccountStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { LinkRepository } from '../bot/repositories/link-repository';

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
   * A Kassa user has at most one Telegram account: an earlier link of that user is removed.
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

      await tx.telegramAccount.updateMany({
        where: { userId: externalAccountId, id: { not: code.accountId } },
        data: { userId: null, linkedAt: null },
      });
      await tx.telegramAccount.update({
        where: { id: code.accountId },
        data: { userId: externalAccountId, linkedAt: now },
      });
      return code.accountId;
    });
  }
}
