import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReminderService } from './bot/services/reminder-service';
import { PrismaTransactionRepository } from './repositories/prisma-transaction-repository';
import { PrismaUserRepository } from './repositories/prisma-user-repository';
import { TelegramBotService } from './telegram-bot.service';

/**
 * Daily overdue-debt reminder to each business owner's own Telegram chat; never to debtors, who
 * have no chat in Kassa. Runs every minute like the standalone bot: ReminderService waits until
 * 09:00 in Dushanbe and claimReminder lets each account get at most one reminder per Dushanbe day,
 * so a restart, a late start or two overlapping ticks never send twice, and a server that slept
 * through 09:00 still reminds once it wakes up.
 */
@Injectable()
export class TelegramReminderTask {
  private readonly logger = new Logger('TelegramReminders');
  private readonly reminders: ReminderService;
  private inProgress = false;

  constructor(
    users: PrismaUserRepository,
    transactions: PrismaTransactionRepository,
    private readonly bot: TelegramBotService,
  ) {
    this.reminders = new ReminderService(users, transactions, (chatId, text) => this.bot.send(chatId, text));
  }

  @Cron(CronExpression.EVERY_MINUTE, { name: 'telegram-reminders' })
  async run(now: Date = new Date()): Promise<number> {
    if (!this.bot.running || this.inProgress) {
      return 0;
    }
    this.inProgress = true;
    try {
      const sent = await this.reminders.runOnce(now);
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
}
