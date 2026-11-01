import type { TransactionRepository } from "../repositories/transaction-repository";
import type { UserRepository } from "../repositories/user-repository";
import type {
  DailySummary,
  DebtorSummary,
  ParsedTransaction,
  StoredTransaction,
} from "../types/transaction";
import { getTodayRange } from "./day-range";
import { buildDebtList } from "./debts";

export class TransactionService {
  constructor(
    private readonly users: UserRepository,
    private readonly transactions: TransactionRepository,
  ) {}

  async createDraft(
    telegramUserId: number,
    parsed: ParsedTransaction,
  ): Promise<StoredTransaction | null> {
    const user = await this.users.findByTelegramUserId(telegramUserId);
    if (!user || user.status !== "active") return null;
    return this.transactions.createPending(user.id, parsed);
  }

  confirm(telegramUserId: number, transactionId: number): Promise<StoredTransaction | null> {
    return this.resolve(telegramUserId, transactionId, "confirmed");
  }

  cancel(telegramUserId: number, transactionId: number): Promise<StoredTransaction | null> {
    return this.resolve(telegramUserId, transactionId, "cancelled");
  }

  async getTodaySummary(telegramUserId: number): Promise<DailySummary | null> {
    const user = await this.users.findByTelegramUserId(telegramUserId);
    if (!user) return null;
    const { from, to } = getTodayRange();
    return this.transactions.getSummary(user.id, from, to);
  }

  async getDebts(telegramUserId: number): Promise<DebtorSummary[] | null> {
    const user = await this.users.findByTelegramUserId(telegramUserId);
    if (!user) return null;
    const balances = await this.transactions.getDebtBalances(user.id);
    return buildDebtList(balances);
  }

  private async resolve(
    telegramUserId: number,
    transactionId: number,
    status: "confirmed" | "cancelled",
  ): Promise<StoredTransaction | null> {
    const user = await this.users.findByTelegramUserId(telegramUserId);
    if (!user) return null;
    return this.transactions.resolvePending(transactionId, user.id, status);
  }
}