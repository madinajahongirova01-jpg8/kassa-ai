import type {
  DailySummary,
  DebtBalance,
  ParsedTransaction,
  StoredTransaction,
  TransactionStatus,
} from "../types/transaction";

export interface TransactionRepository {
  createPending(userId: number, parsed: ParsedTransaction): Promise<StoredTransaction>;
  resolvePending(
    transactionId: number,
    userId: number,
    newStatus: Exclude<TransactionStatus, "pending">,
  ): Promise<StoredTransaction | null>;
  getSummary(userId: number, from: Date, to: Date): Promise<DailySummary>;
  getDebtBalances(userId: number): Promise<DebtBalance[]>;
}