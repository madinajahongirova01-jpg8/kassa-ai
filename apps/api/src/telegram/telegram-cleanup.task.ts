import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TelegramTransactionStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { LINK_ATTEMPT_WINDOW_MS } from './telegram-link.service';

const DAY_MS = 24 * 60 * 60 * 1000;
/** A receipt left unconfirmed this long is abandoned; its buttons then answer "already handled". */
export const PENDING_RECEIPT_MAX_AGE_MS = 7 * DAY_MS;
/** Codes live 10 minutes; a day later they are only clutter, used or not. */
export const EXPIRED_CODE_MAX_AGE_MS = DAY_MS;

export interface TelegramCleanupResult {
  pendingReceipts: number;
  linkCodes: number;
  linkAttempts: number;
}

/**
 * Once a day, at a quiet hour in Dushanbe, deletes Telegram rows nobody can use any more: abandoned
 * PENDING receipts, long-expired link codes and link attempts outside the rate-limit window.
 *
 * Confirmed and cancelled receipts are never touched, and a receipt is deleted only while it is
 * still PENDING with no Kassa references. A confirmation claims its draft with a conditional
 * UPDATE on status = PENDING, so if it races with this DELETE, PostgreSQL rechecks the row after
 * the lock and exactly one of them wins: either the receipt is confirmed and kept, or it is deleted
 * and the late button press finds nothing to confirm.
 */
@Injectable()
export class TelegramCleanupTask {
  private readonly logger = new Logger('TelegramCleanup');

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 3 * * *', { name: 'telegram-cleanup', timeZone: 'Asia/Dushanbe' })
  async run(now: Date = new Date()): Promise<TelegramCleanupResult | null> {
    try {
      const at = now.getTime();
      const [pendingReceipts, linkCodes, linkAttempts] = await Promise.all([
        this.prisma.telegramTransaction.deleteMany({
          where: {
            status: TelegramTransactionStatus.PENDING,
            // occurredAt is set by the app in UTC like `now`; createdAt follows the database time zone.
            occurredAt: { lt: new Date(at - PENDING_RECEIPT_MAX_AGE_MS) },
            syncedAt: null,
            cashEntryId: null,
            debtId: null,
            paymentGroupId: null,
          },
        }),
        this.prisma.telegramLinkCode.deleteMany({ where: { expiresAt: { lt: new Date(at - EXPIRED_CODE_MAX_AGE_MS) } } }),
        this.prisma.telegramLinkAttempt.deleteMany({ where: { attemptedAt: { lt: new Date(at - LINK_ATTEMPT_WINDOW_MS) } } }),
      ]);
      const result = { pendingReceipts: pendingReceipts.count, linkCodes: linkCodes.count, linkAttempts: linkAttempts.count };
      if (result.pendingReceipts + result.linkCodes + result.linkAttempts > 0) {
        this.logger.log(
          `Removed ${result.pendingReceipts} abandoned receipts, ${result.linkCodes} expired link codes, ${result.linkAttempts} old link attempts`,
        );
      }
      return result;
    } catch (error) {
      // Nothing depends on this run; tomorrow's run deletes the same rows.
      this.logger.error(`Telegram cleanup failed: ${error instanceof Error ? error.name : 'Unknown error'}`);
      return null;
    }
  }
}
