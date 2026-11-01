import type { LinkRepository } from "../repositories/link-repository";
import type { UserRepository } from "../repositories/user-repository";
import {
  formatCode,
  generateCode,
  hashCode,
  isValidCodeFormat,
  normalizeCode,
} from "./link-code";

export const LINK_CODE_MINUTES = 10;

export class LinkService {
  constructor(
    private readonly users: UserRepository,
    private readonly links: LinkRepository,
  ) {}

  async createCode(
    telegramUserId: number,
  ): Promise<{ code: string; minutes: number } | null> {
    const user = await this.users.findByTelegramUserId(telegramUserId);
    if (!user || user.status !== "active") return null;

    const code = generateCode();
    const expiresAt = new Date(Date.now() + LINK_CODE_MINUTES * 60 * 1000);
    await this.links.createCode(user.id, hashCode(code), expiresAt);
    return { code: formatCode(code), minutes: LINK_CODE_MINUTES };
  }

  async consumeCode(rawCode: string, externalAccountId: string): Promise<number | null> {
    const code = normalizeCode(rawCode);
    if (!isValidCodeFormat(code)) return null;
    return this.links.consume(hashCode(code), externalAccountId, new Date());
  }
}