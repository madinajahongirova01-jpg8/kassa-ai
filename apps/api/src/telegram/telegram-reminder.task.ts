import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getDushanbeDate, getDushanbeHour } from './bot/services/day-range';
import { REMINDER_HOUR, ReminderService } from './bot/services/reminder-service';
import { PrismaTransactionRepository } from './repositories/prisma-transaction-repository';
import { PrismaUserRepository } from './repositories/prisma-user-repository';
import { TelegramBotService } from './telegram-bot.service';

/** After a successful check, the database is asked again for the same day at most this often. */
export const REMINDER_RECHECK_MS = 60 * 60 * 1000;

/**
 * Daily overdue-debt reminder to each business owner's own Telegram chat; never to debtors, who
 * have no chat in Kassa. ReminderService waits until 09:00 in Dushanbe and claimReminder lets each
 * account get at most one reminder per Dushanbe day, so restarts and overlapping runs never send twice.
 *
 * The cron ticks every minute, but a tick only reads memory. The database is queried on the first
 * tick at or after 09:00 of each Dushanbe day (so a server that slept through 09:00 reminds as soon
 * as it wakes), then at most once per REMINDER_RECHECK_MS for accounts that link or start the bot
 * later that day, and again on the next tick while a run is failing.
 */
@Injectable()
export class TelegramReminderTask {
  private readonly logger = new Logger('TelegramReminders');
  private readonly reminders: ReminderService;
  private inProgress = false;
  private lastCheck: { date: string; at: number } | null = null;

  constructor(
    users: PrismaUserRepository,
    transactions: PrismaTransactionRepository,
    private readonly bot: TelegramBotService,
  ) {
    this.reminders = new ReminderService(users, transactions, (chatId, text) => this.bot.send(chatId, text));
  }

  @Cron(CronExpression.EVERY_MINUTE, { name: 'telegram-reminders' })
  async run(now: Date = new Date()): Promise<number> {
    if (!this.bot.running || this.inProgress || !this.isCheckDue(now)) {
      return 0;
    }
    this.inProgress = true;
    try {
      const sent = await this.reminders.runOnce(now);
      this.lastCheck = { date: getDushanbeDate(now), at: now.getTime() };
      if (sent > 0) {
        this.logger.log(`Reminders sent: ${sent}`);
      }
      return sent;
    } catch (error) {
      this.logger.error(`Reminder run failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return 0;
    } finally {
      this.inProgress = false;
    }
  }

  private isCheckDue(now: Date): boolean {
    if (getDushanbeHour(now) < REMINDER_HOUR) {
      return false;
    }
    const last = this.lastCheck;
    return last === null || last.date !== getDushanbeDate(now) || now.getTime() - last.at >= REMINDER_RECHECK_MS;
  }
}
