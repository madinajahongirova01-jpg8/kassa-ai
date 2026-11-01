import { randomBytes } from "node:crypto";

export interface PendingChoice {
  telegramUserId: number;
  amountDiram: number;
  description: string;
}

const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 1000;

const store = new Map<string, { choice: PendingChoice; expiresAt: number }>();

function removeExpired(now: number): void {
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

export function savePending(choice: PendingChoice): string {
  const now = Date.now();
  if (store.size >= MAX_ENTRIES) removeExpired(now);
  const key = randomBytes(6).toString("hex");
  store.set(key, { choice, expiresAt: now + TTL_MS });
  return key;
}

export function takePending(key: string, telegramUserId: number): PendingChoice | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  if (entry.choice.telegramUserId !== telegramUserId) return null;
  store.delete(key);
  return entry.choice;
}