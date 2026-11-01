import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Bot, GrammyError } from 'grammy';
import { Env } from '../config/env';
import { LinkService } from './bot/services/link-service';
import { TransactionService } from './bot/services/transaction-service';
import { UserService } from './bot/services/user-service';
import { PrismaLinkRepository } from './repositories/prisma-link-repository';
import { PrismaTransactionRepository } from './repositories/prisma-transaction-repository';
import { PrismaUserRepository } from './repositories/prisma-user-repository';
import { createTelegramBot, TelegramBotDependencies } from './telegram-bot';

const CONFLICT = 409;
export const CONFLICT_RETRY_MS = 15_000;

/**
 * Runs the Telegram bot (long polling) inside the API process when TELEGRAM_BOT_TOKEN is set.
 * Without a token, and always in tests, the bot stays off and the API works as before.
 */
@Injectable()
export class TelegramBotService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger('TelegramBot');
  private bot: Bot | null = null;
  private retry: NodeJS.Timeout | undefined;
  readonly deps: TelegramBotDependencies;

  constructor(
    private readonly config: ConfigService<Env, true>,
    users: PrismaUserRepository,
    transactions: PrismaTransactionRepository,
    links: PrismaLinkRepository,
  ) {
    this.deps = {
      userService: new UserService(users),
      transactionService: new TransactionService(users, transactions),
      linkService: new LinkService(users, links),
    };
  }

  get running(): boolean {
    return this.bot !== null;
  }

  onApplicationBootstrap(): void {
    const token = this.config.get('TELEGRAM_BOT_TOKEN', { infer: true });
    if (token === undefined || this.config.get('NODE_ENV', { infer: true }) === 'test') {
      this.logger.log('Telegram bot is off (TELEGRAM_BOT_TOKEN is not set)');
      return;
    }

    const bot = createTelegramBot(token, this.deps);
    this.bot = bot;
    this.poll(bot);
  }

  /**
   * Not awaited: start() resolves only when polling stops. While another instance polls with the
   * same token (for example the old one during a deploy), Telegram answers 409 and grammY stops;
   * polling is then retried, so the bot comes back once the other instance is gone. Any other
   * fatal error, such as a revoked token (401), turns the bot off.
   */
  private poll(bot: Bot): void {
    bot
      .start({ onStart: (me) => this.logger.log(`Telegram bot started as @${me.username}`) })
      .catch((error: unknown) => {
        if (this.bot !== bot) {
          return;
        }
        if (error instanceof GrammyError && error.error_code === CONFLICT) {
          this.logger.warn(`Another instance is polling this bot; retrying in ${CONFLICT_RETRY_MS / 1000} s`);
          this.retry = setTimeout(() => {
            this.retry = undefined;
            if (this.bot === bot) {
              this.poll(bot);
            }
          }, CONFLICT_RETRY_MS);
          return;
        }
        this.logger.error(`Telegram bot stopped: ${error instanceof Error ? error.message : 'Unknown error'}`);
        this.bot = null;
      });
  }

  async onApplicationShutdown(): Promise<void> {
    clearTimeout(this.retry);
    this.retry = undefined;
    const bot = this.bot;
    this.bot = null;
    if (bot?.isRunning()) {
      await bot.stop();
    }
  }

  async send(chatId: number, text: string): Promise<void> {
    if (this.bot === null) {
      throw new Error('Telegram bot is not running');
    }
    await this.bot.api.sendMessage(chatId, text);
  }
}
