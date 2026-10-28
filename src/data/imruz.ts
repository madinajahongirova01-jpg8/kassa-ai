export type DayEntryKind = "income" | "expense" | "debt";
export type DayEntrySource = "voice" | "text";

export type DayEntry = {
  id: string;
  time: string;
  title: string;
  shortTitle: string;
  kind: DayEntryKind;
  source: DayEntrySource;
  amount: number;
};

export type WeekDay = {
  short: string;
  name: string;
  profit: number;
  today?: boolean;
};

export const todayEntries: DayEntry[] = [
  { id: "d1", time: "08:10", title: "Орд, 2 халта", shortTitle: "Орд, 2 халта", kind: "expense", source: "voice", amount: 600 },
  { id: "d2", time: "09:40", title: "Такси", shortTitle: "Такси", kind: "expense", source: "voice", amount: 30 },
  { id: "d3", time: "12:05", title: "Музди коргар", shortTitle: "Музди коргар", kind: "expense", source: "text", amount: 150 },
  { id: "d4", time: "13:30", title: "Фурӯши нисфирӯзӣ", shortTitle: "Фурӯш", kind: "income", source: "voice", amount: 950 },
  { id: "d5", time: "15:10", title: "Рустам — насия", shortTitle: "Рустам — насия", kind: "debt", source: "voice", amount: 110 },
  { id: "d6", time: "18:20", title: "Фурӯши бегоҳ", shortTitle: "Фурӯши бегоҳ", kind: "income", source: "voice", amount: 850 },
];

export const expenseHint = "орд, такси, музд";

export const weekProfit: WeekDay[] = [
  { short: "Пш", name: "панҷшанбе", profit: 620 },
  { short: "Ҷм", name: "ҷумъа", profit: 540 },
  { short: "Шб", name: "шанбе", profit: 1160 },
  { short: "Яш", name: "якшанбе", profit: -40 },
  { short: "Дш", name: "душанбе", profit: 890 },
  { short: "Сш", name: "сешанбе", profit: 865 },
  { short: "Имрӯз", name: "имрӯз", profit: 1020, today: true },
];
