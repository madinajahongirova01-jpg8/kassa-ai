import { debtCustomers, debtEvents, debtsToday, sampleCustomers, type DebtCustomer, type DebtEvent } from "@/data/debts";

// Sample debt book for the pages that are not connected to the API yet. /app/debts does not use it.

export type DebtState = {
  today: string;
  customers: DebtCustomer[];
  events: DebtEvent[];
};

const sampleState: DebtState = { today: debtsToday, customers: sampleCustomers(debtCustomers, debtEvents), events: debtEvents };

export function useDebtState() {
  return sampleState;
}
