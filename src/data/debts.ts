export type DebtEventType = "debt" | "payment";

/** Amounts are integer dirams. */
export type DebtCustomer = {
  id: string;
  name: string;
  phone: string;
  note?: string;
  /** Earliest due date among the customer's open debts. */
  dueDate: string | null;
  /** Remaining amount the customer owes, as calculated by the API. */
  balance: number;
  /** Amount of the newest debt, shown crossed out once everything is paid. */
  lastDebtAmount: number;
};

export type DebtEvent = {
  id: string;
  customerId: string;
  type: DebtEventType;
  note: string;
  /** Positive for a debt, negative for a payment. */
  amount: number;
  date: string;
  time: string;
  /** How a sample event was recorded ("Овозӣ", "Дастӣ", "Нақд"); real events don't have it. */
  tag?: string;
};

export type DebtBook = {
  today: string;
  businessName: string | null;
  customers: DebtCustomer[];
  events: DebtEvent[];
};

// ---------------------------------------------------------------------------------------------
// Sample data, unchanged from the design. /app/debts reads real data from the API; the pages that
// are not connected yet (Имрӯз, Дафтар, Ҳисобот) still use this book through lib/debtStore until
// they are. Its amounts are whole somoni, as those pages format them with formatSomoni.

export const debtsToday = "2024-05-24";

type SampleCustomer = Omit<DebtCustomer, "balance" | "lastDebtAmount">;
type SampleEvent = DebtEvent & { tag: string };

export const debtCustomers: SampleCustomer[] = [
  { id: "c1", name: "Алишер Қосимов", phone: "+992 90 123 4567", note: "Чойхонаи марказӣ", dueDate: "2024-05-25" },
  { id: "c2", name: "Зафар Мирзоев", phone: "+992 93 555 7890", note: "муштарии доимӣ", dueDate: "2024-05-19" },
  { id: "c3", name: "Рустам Каримов", phone: "+992 98 777 2211", note: "ҳамсоя", dueDate: "2024-05-28" },
  { id: "c4", name: "Парвина Саидова", phone: "+992 91 888 3344", note: "муштарии нав", dueDate: "2024-05-30" },
  { id: "c5", name: "Фаррух Назаров", phone: "+992 92 444 1010", note: "муштарии доимӣ", dueDate: null },
];

export const debtEvents: SampleEvent[] = [
  { id: "e1", customerId: "c1", type: "debt", note: "Орд, 1 халта", tag: "Овозӣ", amount: 180, date: "2024-05-02", time: "09:12" },
  { id: "e2", customerId: "c1", type: "payment", note: "Пурра баргардонд", tag: "Нақд", amount: -180, date: "2024-05-12", time: "17:40" },
  { id: "e3", customerId: "c1", type: "debt", note: "Равған 2 қуттӣ, шакар", tag: "Овозӣ", amount: 220, date: "2024-05-20", time: "14:32" },
  { id: "e4", customerId: "c2", type: "debt", note: "Равған 2 л, шакар 3 кг", tag: "Дастӣ", amount: 180, date: "2024-05-12", time: "11:05" },
  { id: "e5", customerId: "c2", type: "payment", note: "Каме баргардонд", tag: "Нақд", amount: -35, date: "2024-05-15", time: "18:20" },
  { id: "e6", customerId: "c3", type: "debt", note: "Биринҷ ва нахӯд", tag: "Овозӣ", amount: 110, date: "2024-05-24", time: "15:10" },
  { id: "e7", customerId: "c4", type: "debt", note: "Чой ва қанд", tag: "Дастӣ", amount: 70, date: "2024-05-23", time: "12:40" },
  { id: "e8", customerId: "c5", type: "debt", note: "Орд ва равған", tag: "Овозӣ", amount: 200, date: "2024-05-10", time: "10:00" },
  { id: "e9", customerId: "c5", type: "payment", note: "Пурра баргардонд", tag: "Нақд", amount: -200, date: "2024-05-22", time: "17:45" },
];

export function customerBalance(customerId: string, events: DebtEvent[]) {
  return events.filter((e) => e.customerId === customerId).reduce((sum, e) => sum + e.amount, 0);
}

/** Balances of the sample customers, derived from the sample events like before. */
export function sampleCustomers(customers: SampleCustomer[], events: DebtEvent[]): DebtCustomer[] {
  return customers.map((customer) => ({
    ...customer,
    balance: customerBalance(customer.id, events),
    lastDebtAmount: events.findLast((e) => e.customerId === customer.id && e.type === "debt")?.amount ?? 0,
  }));
}
