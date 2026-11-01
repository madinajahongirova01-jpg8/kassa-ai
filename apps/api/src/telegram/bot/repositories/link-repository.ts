export interface LinkRepository {
  createCode(userId: number, codeHash: string, expiresAt: Date): Promise<void>;
  consume(codeHash: string, externalAccountId: string, now: Date): Promise<number | null>;
}