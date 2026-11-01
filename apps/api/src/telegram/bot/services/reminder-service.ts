import type { TransactionRepository } from "../repositories/transaction-repository";
import type { UserRepository } from "../repositories/user-repository";
import { MESSAGES_EXTRA } from "../i18n/messages-extra";
import { getDushanbeDate, getDushanbeHour } from "./day-range";
import { buildDebtList } from "./debts";
import { formatDiram } from "./money";

export const REMINDER_HOUR = 9;

export type SendMessage = (chatId: number, text: string) => Promise<void>;

export class ReminderService {
  constructor(
    private readonly users: UserRepository,
    private readonly transactions: TransactionRepository,
    private readonly send: SendMessage,
  ) {}

  async runOnce(now: Date = new Date()): Promise<number> {
    if (getDushanbeHour(now) < REMINDER_HOUR) return 0;

    const today = getDushanbeDate(now);
    const due = await this.users.listDueForReminder(today);
    let sent = 0;

    for (const user of due) {
      try {
        const claimed = await this.users.claimReminder(user.id, today);
        if (!claimed) continue;

        const balances = await this.transactions.getDebtBalances(user.id);
        const overdue = buildDebtList(balances, now).filter((d) => d.isOverdue);
        if (overdue.length === 0) continue;

        const lang = user.language ?? "tg";
        const lines = overdue
          .map((d) => `• ${d.customerName}: ${formatDiram(d.balanceDiram, lang)}`)
          .join("\n");
        const total = overdue.reduce((sum, d) => sum + d.balanceDiram, 0);

        await this.send(
          user.telegramChatId,
          MESSAGES_EXTRA[lang].reminder(lines, formatDiram(total, lang)),
        );
        sent++;
      } catch (error) {
        console.error(
          `Reminder failed for user ${user.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
    return sent;
  }
}