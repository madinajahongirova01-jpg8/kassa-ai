import { todayEntries, type DayEntry } from "@/data/imruz";

export type DaftarCategory = "sale" | "goods" | "salary" | "utilities" | "transport" | "rent" | "debt";
export type DaftarSource = "voice" | "text" | "photo";
export type DaftarKind = "income" | "expense" | "debtGiven" | "debtPaid";

export type DaftarEntry = {
  id: string;
  date: string;
  time: string;
  title: string;
  category: DaftarCategory;
  source: DaftarSource;
  kind: DaftarKind;
  amount: number;
};

export const daftarCategories: Record<DaftarCategory, string> = {
  sale: "фурӯш",
  goods: "мол",
  salary: "маош",
  utilities: "коммуналӣ",
  transport: "роҳкиро",
  rent: "иҷора",
  debt: "насия",
};


const todayCategories: Record<string, DaftarCategory> = { d1: "goods", d2: "transport", d3: "salary", d4: "sale", d6: "sale" };

function fromToday(entry: DayEntry): DaftarEntry {
  return {
    id: entry.id,
    date: "2024-05-24",
    time: entry.time,
    title: entry.title,
    category: todayCategories[entry.id],
    source: entry.source,
    kind: entry.kind === "income" ? "income" : "expense",
    amount: entry.amount,
  };
}

// Cash entries only; debt rows come from the debt store. Day totals match the Imruz week chart.
export const cashEntries: DaftarEntry[] = [
  ...todayEntries.filter((e) => e.kind !== "debt").map(fromToday),
  { id: "l1", date: "2024-05-23", time: "19:05", title: "Фурӯши рӯз", category: "sale", source: "voice", kind: "income", amount: 1805 },
  { id: "l2", date: "2024-05-23", time: "10:30", title: "Гӯшт, 5 кг (акси чек)", category: "goods", source: "photo", kind: "expense", amount: 650 },
  { id: "l3", date: "2024-05-23", time: "09:00", title: "Барқ ва газ", category: "utilities", source: "voice", kind: "expense", amount: 290 },
  { id: "l4", date: "2024-05-22", time: "19:20", title: "Фурӯши рӯз", category: "sale", source: "voice", kind: "income", amount: 1400 },
  { id: "l5", date: "2024-05-22", time: "12:10", title: "Музди коргар", category: "salary", source: "text", kind: "expense", amount: 150 },
  { id: "l6", date: "2024-05-22", time: "09:40", title: "Орд, 1 халта", category: "goods", source: "voice", kind: "expense", amount: 300 },
  { id: "l7", date: "2024-05-22", time: "09:15", title: "Такси", category: "transport", source: "voice", kind: "expense", amount: 60 },
  { id: "l8", date: "2024-05-21", time: "18:30", title: "Фурӯши рӯз", category: "sale", source: "voice", kind: "income", amount: 460 },
  { id: "l9", date: "2024-05-21", time: "10:00", title: "Иҷораи дӯкон, ҳафта", category: "rent", source: "text", kind: "expense", amount: 500 },
  { id: "l10", date: "2024-05-20", time: "19:00", title: "Фурӯши рӯз", category: "sale", source: "voice", kind: "income", amount: 1900 },
  { id: "l11", date: "2024-05-20", time: "11:20", title: "Равған, 2 қуттӣ", category: "goods", source: "photo", kind: "expense", amount: 590 },
  { id: "l12", date: "2024-05-20", time: "12:00", title: "Музди коргар", category: "salary", source: "text", kind: "expense", amount: 150 },
  { id: "l13", date: "2024-05-19", time: "19:10", title: "Фурӯши рӯз", category: "sale", source: "voice", kind: "income", amount: 1180 },
  { id: "l14", date: "2024-05-19", time: "10:05", title: "Гӯшт, 4 кг", category: "goods", source: "voice", kind: "expense", amount: 520 },
  { id: "l15", date: "2024-05-19", time: "08:50", title: "Такси", category: "transport", source: "voice", kind: "expense", amount: 120 },
  { id: "l16", date: "2024-05-18", time: "19:15", title: "Фурӯши рӯз", category: "sale", source: "voice", kind: "income", amount: 1250 },
  { id: "l17", date: "2024-05-18", time: "10:20", title: "Шакар, 2 халта", category: "goods", source: "voice", kind: "expense", amount: 480 },
  { id: "l18", date: "2024-05-18", time: "12:00", title: "Музди коргар", category: "salary", source: "text", kind: "expense", amount: 150 },
];
