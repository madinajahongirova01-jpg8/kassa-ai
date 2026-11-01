import type { Bot } from "grammy";
import { MESSAGES, NEED_START } from "../i18n/messages";
import type { Messages } from "../i18n/messages";
import { MESSAGES_EXTRA } from "../i18n/messages-extra";
import { chooseTypeKeyboard } from "../keyboards/choose-type";
import { confirmKeyboard } from "../keyboards/confirm";
import { formatDiram } from "../services/money";
import { savePending, takePending } from "../services/pending-choice";
import {
  extractAmountDiram,
  extractCustomerName,
  parseTransactionText,
} from "../services/transaction-parser";
import type { TransactionService } from "../services/transaction-service";
import type { UserService } from "../services/user-service";
import type { Lang } from "../types/language";
import type { StoredTransaction, TransactionType } from "../types/transaction";
import { requireLanguage } from "./require-language";

function receipt(tx: StoredTransaction, m: Messages, lang: Lang): string {
  let text = `${m.types[tx.type]}\n${m.amount}: ${formatDiram(tx.amountDiram, lang)}`;
  if (tx.customerName) text += `\n${m.customer}: ${tx.customerName}`;
  text += `\n${m.description}: ${tx.description}`;
  return text;
}

export function registerTransactionHandlers(
  bot: Bot,
  service: TransactionService,
  userService: UserService,
): void {
  bot.chatType("private").on("message:text", async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith("/")) return;

    const lang = await requireLanguage(ctx, userService);
    if (!lang) return;
    const m = MESSAGES[lang];
    const x = MESSAGES_EXTRA[lang];

    const parsed = parseTransactionText(text);

    if (!parsed) {
      const amount = extractAmountDiram(text);
      if (amount === null) {
        await ctx.reply(`${m.notUnderstood}\n\n${x.needAmount}`);
        return;
      }
      const key = savePending({
        telegramUserId: ctx.from.id,
        amountDiram: amount,
        description: text.trim().slice(0, 200),
      });
      await ctx.reply(x.askType(formatDiram(amount, lang)), {
        reply_markup: chooseTypeKeyboard(key, x.pickSale, x.pickExpense, x.pickCredit),
      });
      return;
    }

    const needsCustomer = parsed.type === "credit_sale" || parsed.type === "debt_payment";
    if (needsCustomer && !parsed.customerName) {
      await ctx.reply(m.needCustomer);
      return;
    }

    const draft = await service.createDraft(ctx.from.id, parsed);
    if (!draft) {
      await ctx.reply(NEED_START);
      return;
    }

    await ctx.reply(`${receipt(draft, m, lang)}\n\n${m.askSave}`, {
      reply_markup: confirmKeyboard(draft.id, m.confirmButton, m.cancelButton),
    });
  });

  bot.callbackQuery(/^pick:([0-9a-f]{12}):(sale|expense|credit)$/, async (ctx) => {
    const key = ctx.match[1];
    const choice = ctx.match[2];
    const lang = (await userService.getLanguage(ctx.from.id)) ?? "tg";
    const m = MESSAGES[lang];
    const x = MESSAGES_EXTRA[lang];

    const pending = takePending(key, ctx.from.id);
    if (!pending) {
      await ctx.answerCallbackQuery({ text: x.choiceExpired });
      await ctx.editMessageReplyMarkup().catch(() => undefined);
      return;
    }
    await ctx.answerCallbackQuery();

    const type: TransactionType = choice === "credit" ? "credit_sale" : (choice as TransactionType);
    const customerName = type === "credit_sale" ? extractCustomerName(pending.description) : null;

    if (type === "credit_sale" && !customerName) {
      await ctx.editMessageReplyMarkup().catch(() => undefined);
      await ctx.reply(m.needCustomer);
      return;
    }

    const draft = await service.createDraft(ctx.from.id, {
      type,
      amountDiram: pending.amountDiram,
      description: pending.description,
      customerName,
    });
    if (!draft) {
      await ctx.reply(NEED_START);
      return;
    }

    await ctx.editMessageText(`${receipt(draft, m, lang)}\n\n${m.askSave}`, {
      reply_markup: confirmKeyboard(draft.id, m.confirmButton, m.cancelButton),
    });
  });

  bot.callbackQuery(/^tx:(confirm|cancel):(\d+)$/, async (ctx) => {
    const action = ctx.match[1];
    const id = Number(ctx.match[2]);
    const lang = (await userService.getLanguage(ctx.from.id)) ?? "tg";
    const m = MESSAGES[lang];

    const tx =
      action === "confirm"
        ? await service.confirm(ctx.from.id, id)
        : await service.cancel(ctx.from.id, id);

    if (!tx) {
      await ctx.answerCallbackQuery({ text: m.alreadyDone });
      await ctx.editMessageReplyMarkup().catch(() => undefined);
      return;
    }

    await ctx.answerCallbackQuery();
    const footer = action === "confirm" ? m.saved : m.cancelled;
    await ctx.editMessageText(`${receipt(tx, m, lang)}\n\n${footer}`);
  });
}