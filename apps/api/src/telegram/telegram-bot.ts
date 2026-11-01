import { Logger } from '@nestjs/common';
import { Bot, BotError } from 'grammy';
import type { UserFromGetMe } from 'grammy/types';
import { registerDebtsCommand } from './bot/commands/debts';
import { registerHelpCommand } from './bot/commands/help';
import { registerLinkCommand } from './bot/commands/link';
import { registerStartCommand } from './bot/commands/start';
import { registerStopCommand } from './bot/commands/stop';
import { registerTodayCommand } from './bot/commands/today';
import { registerTransactionHandlers } from './bot/commands/transaction';
import { MESSAGES_EXTRA } from './bot/i18n/messages-extra';
import type { LinkService } from './bot/services/link-service';
import { formatDiram } from './bot/services/money';
import type { TransactionService } from './bot/services/transaction-service';
import type { UserService } from './bot/services/user-service';
import type { Lang } from './bot/types/language';
import { TelegramAmountError } from './repositories/prisma-transaction-repository';
import { TelegramSyncError } from './telegram-kassa-sync';

export interface TelegramBotDependencies {
  userService: UserService;
  transactionService: TransactionService;
  linkService: LinkService;
}

const logger = new Logger('TelegramBot');

/** What to tell the owner, in their language, when saving a receipt failed. Nothing was saved. */
export function botErrorMessage(error: unknown, lang: Lang): string {
  const x = MESSAGES_EXTRA[lang];
  if (error instanceof TelegramAmountError) {
    return x.amountTooLarge;
  }
  if (error instanceof TelegramSyncError) {
    switch (error.reason) {
      case 'customer-not-found':
        return x.customerNotFound;
      case 'customer-ambiguous':
        return x.customerAmbiguous;
      case 'no-open-debts':
        return x.noOpenDebts;
      case 'exceeds-debt':
        return x.exceedsDebt(formatDiram(error.remainingDirams ?? 0, lang));
    }
  }
  return x.saveFailed;
}

/**
 * Replies to the update that failed. Expected refusals (unknown customer, amount too large...) are
 * not logged; anything else is logged without message text, which may contain customer data.
 */
export async function handleBotError(err: BotError, users: UserService): Promise<void> {
  const error = err.error;
  const reason = error instanceof Error ? error.message : 'Unknown error';
  if (reason.includes('query is too old')) {
    return;
  }
  if (!(error instanceof TelegramSyncError) && !(error instanceof TelegramAmountError)) {
    logger.error(`Error while handling update ${err.ctx.update.update_id}: ${error instanceof Error ? error.name : 'Unknown error'}`);
  }

  const from = err.ctx.from;
  if (from === undefined) {
    return;
  }
  try {
    const text = botErrorMessage(error, (await users.getLanguage(from.id)) ?? 'tg');
    if (err.ctx.callbackQuery !== undefined) {
      await err.ctx.answerCallbackQuery({ text, show_alert: true });
    } else if (err.ctx.chat !== undefined) {
      await err.ctx.reply(text);
    }
  } catch {
    // Telegram or the database is unreachable: the failure is already logged above when unexpected.
  }
}

/** The standalone bot's handlers, registered in the same order as its src/bot.ts. */
export function createTelegramBot(token: string, deps: TelegramBotDependencies, botInfo?: UserFromGetMe): Bot {
  const bot = new Bot(token, botInfo === undefined ? undefined : { botInfo });

  registerStartCommand(bot, deps.userService);
  registerHelpCommand(bot, deps.userService);
  registerStopCommand(bot, deps.userService);
  registerLinkCommand(bot, deps.linkService, deps.userService);
  registerTodayCommand(bot, deps.transactionService, deps.userService);
  registerDebtsCommand(bot, deps.transactionService, deps.userService);
  registerTransactionHandlers(bot, deps.transactionService, deps.userService);

  bot.catch((err) => handleBotError(err, deps.userService));
  return bot;
}
