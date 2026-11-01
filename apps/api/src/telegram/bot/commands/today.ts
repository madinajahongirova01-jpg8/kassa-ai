import type { Bot } from "grammy";
import { MESSAGES, NEED_START } from "../i18n/messages";
import { formatDiram } from "../services/money";
import type { TransactionService } from "../services/transaction-service";
import type { UserService } from "../services/user-service";
import type { Lang } from "../types/language";
import { requireLanguage } from "./require-language";

function formatSigned(diram: number, lang: Lang): string {
  return diram < 0 ? `-${formatDiram(-diram, lang)}` : formatDiram(diram, lang);
}

export function registerTodayCommand(
  bot: Bot,
  service: TransactionService,
  userService: UserService,
): void {
  bot.chatType("private").command("today", async (ctx) => {
    const lang = await requireLanguage(ctx, userService);
    if (!lang) return;
    const m = MESSAGES[lang];

    const s = await service.getTodaySummary(ctx.from!.id);
    if (!s) {
      await ctx.reply(NEED_START);
      return;
    }

    let text =
      `${m.todayTitle}\n\n` +
      `${m.income}: ${formatDiram(s.incomeDiram, lang)}\n` +
      `${m.expense}: ${formatDiram(s.expenseDiram, lang)}\n` +
      `${m.profit}: ${formatSigned(s.profitDiram, lang)}`;
    if (s.creditGivenDiram > 0) {
      text += `\n\n${m.creditGiven(formatDiram(s.creditGivenDiram, lang))}`;
    }
    await ctx.reply(text);
  });
}