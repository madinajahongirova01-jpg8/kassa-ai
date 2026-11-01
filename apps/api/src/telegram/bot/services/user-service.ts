import type { RegisterUserInput, UserRepository } from "../repositories/user-repository";
import type { Lang } from "../types/language";
import type { User } from "../types/user";

export class UserService {
  constructor(private readonly users: UserRepository) {}

  registerUser(input: RegisterUserInput): Promise<{ user: User; isNew: boolean }> {
    return this.users.upsertFromTelegram(input);
  }

  async getLanguage(telegramUserId: number): Promise<Lang | null> {
    const user = await this.users.findByTelegramUserId(telegramUserId);
    return user?.language ?? null;
  }

  setLanguage(telegramUserId: number, language: Lang): Promise<User | null> {
    return this.users.setLanguage(telegramUserId, language);
  }

  stopUser(telegramUserId: number): Promise<User | null> {
    return this.users.setStatus(telegramUserId, "stopped");
  }
}