import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LinkService } from './bot/services/link-service';
import { PrismaLinkRepository, TelegramLinkConflict, TelegramLinkConflictError } from './repositories/prisma-link-repository';
import { PrismaUserRepository } from './repositories/prisma-user-repository';

export const LINK_ATTEMPT_LIMIT = 5;
export const LINK_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export const INVALID_CODE_MESSAGE = 'Invalid or expired code';
export const TOO_MANY_ATTEMPTS_MESSAGE = 'Too many attempts, try again later';
export const CONFLICT_MESSAGES: Record<TelegramLinkConflict, string> = {
  'kassa-user-linked': 'Your account already has a linked Telegram account. Unlink it first',
  'telegram-account-linked': 'This Telegram account is already linked to another account',
};

export interface TelegramLinkStatus {
  linked: boolean;
  linkedAt: Date | null;
}

/**
 * Linking a Telegram chat to the signed-in Kassa user. Wrong codes are counted per Kassa user in the
 * database: every attempt reserves a slot under a lock on the user row before the code is checked,
 * so concurrent requests cannot exceed the limit. Slots of successful or conflicting attempts (the
 * code was right) are released; wrong ones stay for the window.
 */
@Injectable()
export class TelegramLinkService {
  private readonly links: LinkService;

  constructor(
    private readonly prisma: PrismaService,
    users: PrismaUserRepository,
    linkRepository: PrismaLinkRepository,
  ) {
    this.links = new LinkService(users, linkRepository);
  }

  async link(userId: string, code: string): Promise<TelegramLinkStatus> {
    const attempt = await this.reserveAttempt(userId);

    let accountId: number | null;
    try {
      accountId = await this.links.consumeCode(code, userId);
    } catch (error) {
      if (error instanceof TelegramLinkConflictError) {
        await this.releaseAttempt(userId, attempt.id);
        throw new ConflictException(CONFLICT_MESSAGES[error.reason]);
      }
      throw error;
    }

    if (accountId === null) {
      throw new BadRequestException({
        message: INVALID_CODE_MESSAGE,
        details: [`attemptsLeft: ${Math.max(LINK_ATTEMPT_LIMIT - attempt.count, 0)}`],
      });
    }
    await this.releaseAttempt(userId, attempt.id);
    return this.status(userId);
  }

  async status(userId: string): Promise<TelegramLinkStatus> {
    const account = await this.prisma.telegramAccount.findUnique({ where: { userId }, select: { linkedAt: true } });
    return { linked: account !== null, linkedAt: account?.linkedAt ?? null };
  }

  /** Removes the link of this Kassa user only; the Telegram chat keeps working as an unlinked bot. */
  async unlink(userId: string): Promise<void> {
    await this.prisma.telegramAccount.updateMany({ where: { userId }, data: { userId: null, linkedAt: null } });
  }

  /** Counts this attempt and returns how many attempts are in the window, including it. */
  private async reserveAttempt(userId: string): Promise<{ id: number; count: number }> {
    const now = new Date();
    const since = new Date(now.getTime() - LINK_ATTEMPT_WINDOW_MS);
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE`;
      await tx.telegramLinkAttempt.deleteMany({ where: { userId, attemptedAt: { lt: since } } });
      const recent = await tx.telegramLinkAttempt.count({ where: { userId, attemptedAt: { gte: since } } });
      if (recent >= LINK_ATTEMPT_LIMIT) {
        throw new HttpException(TOO_MANY_ATTEMPTS_MESSAGE, HttpStatus.TOO_MANY_REQUESTS);
      }
      // attemptedAt comes from the app clock (UTC), like the window it is compared with.
      const created = await tx.telegramLinkAttempt.create({ data: { userId, attemptedAt: now }, select: { id: true } });
      return { id: created.id, count: recent + 1 };
    });
  }

  private async releaseAttempt(userId: string, id: number): Promise<void> {
    await this.prisma.telegramLinkAttempt.deleteMany({ where: { id, userId } });
  }
}
