import type { Lang } from "../types/language";
import type { User } from "../types/user";

export interface RegisterUserInput {
  telegramUserId: number;
  telegramChatId: number;
  firstName: string | null;
}

export interface UserRepository {
  upsertFromTelegram(input: RegisterUserInput): Promise<{ user: User; isNew: boolean }>;
  findByTelegramUserId(telegramUserId: number): Promise<User | null>;
  setLanguage(telegramUserId: number, language: Lang): Promise<User | null>;
  setStatus(telegramUserId: number, status: "active" | "stopped"): Promise<User | null>;
  listDueForReminder(date: string): Promise<User[]>;
  claimReminder(userId: number, date: string): Promise<boolean>;
}