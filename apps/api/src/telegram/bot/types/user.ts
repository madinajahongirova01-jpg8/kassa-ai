import type { Lang } from "./language";

export interface User {
  id: number;
  telegramUserId: number;
  telegramChatId: number;
  firstName: string | null;
  status: "active" | "stopped";
  language: Lang | null;
}