import type { Bot } from "grammy";
import { MESSAGES, NEED_START } from "../i18n/messages";
import { formatDiram } from "../services/money";
import type { TransactionService } from "../services/transaction-service";
import type { UserService } from "../services/user-service";
import { requireLanguage } from "./require-language";

export function registerDebtsCommand(
  bot: Bot,
  service: TransactionService,
  userService: UserService,
): void {
  bot.chatType("private").command("debts", async (ctx) => {
    const lang = await requireLanguage(ctx, userService);
    if (!lang) return;
    const m = MESSAGES[lang];

    const debts = await service.getDebts(ctx.from!.id);
    if (!debts) {
      await ctx.reply(NEED_START);
      return;
    }
    if (debts.length === 0) {
      await ctx.reply(m.noDebts);
      return;
    }

    const total = debts.reduce((sum, d) => sum + d.balanceDiram, 0);
    const overdue = debts.filter((d) => d.isOverdue);
    const regular = debts.filter((d) => !d.isOverdue);

    let text = `${m.debtsTitle}\n\n${m.total}: ${formatDiram(total, lang)}`;
    if (overdue.length > 0) {
      text += `\n\n${m.overdueHeader}`;
      for (const d of overdue) {
        text += `\n• ${d.customerName}: ${formatDiram(d.balanceDiram, lang)}`;
      }
    }
    if (regular.length > 0) {
      text += `\n\n${m.otherHeader}`;
      for (const d of regular) {
        text += `\n• ${d.customerName}: ${formatDiram(d.balanceDiram, lang)}`;
      }
    }
    await ctx.reply(text);
  });
}