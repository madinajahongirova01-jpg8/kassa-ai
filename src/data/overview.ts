import type { DailyFlow, ExpenseShare, Kpi, Receipt, Transaction } from "@/data/types";

export const quickInput = {
  transcript: "Имрӯз 2 халта орд гирифтам 600, такси 30, ба коргар 150 додам. Фурӯш 1800 шуд.",
  engine: "Kassa AI Voice Engine v2.4",
  engineShort: "Kassa AI Voice V2.4",
  detected: "4 амалиёт ва 1 фоида дар як сония муайян шуд",
};

export const todayReceipt: Receipt = {
  id: "0842",
  title: "Расиди ҳушманди AI #0842",
  subtitle: "Чойхонаи Руҳ — Нуқтаи фурӯши №1",
  time: "Имрӯз • 16:42",
  lines: [
    { label: "Орд (2 халта)", amount: -600 },
    { label: "Роҳкиро / Такси", amount: -30 },
    { label: "Маоши коргар", amount: -150 },
    { label: "Фурӯши рӯз", amount: 1800 },
  ],
};

export const overviewKpis: Kpi[] = [
  {
    label: "Даромад (Моҳ)",
    value: 48600,
    icon: "trending_up",
    iconClassName: "bg-primary-fixed/50 text-on-primary-fixed-variant",
    valueClassName: "text-on-surface",
    badge: "+14.2%",
    badgeIcon: "arrow_upward",
    badgeTone: "primary",
    note: "нисбат ба моҳи гузашта",
    compact: {
      label: "Даромад (Моҳ)",
      icon: "trending_up",
      iconClassName: "bg-secondary-container text-on-secondary-container",
      valueClassName: "text-on-surface",
      note: "+14.2% нисбат ба гузашта",
      noteClassName: "text-primary",
    },
  },
  {
    label: "Хароҷот (Моҳ)",
    value: 31200,
    icon: "shopping_cart_checkout",
    iconClassName: "bg-surface-container-high text-on-surface-variant",
    valueClassName: "text-on-surface",
    badge: "-3.8%",
    badgeIcon: "arrow_downward",
    badgeTone: "primary",
    note: "сарфа нисбат ба нақша",
    compact: {
      label: "Хароҷот (Моҳ)",
      icon: "trending_down",
      iconClassName: "bg-error-container text-on-error-container",
      valueClassName: "text-on-surface",
      note: "-3.8% сарфаҷӯӣ",
      noteClassName: "text-primary",
    },
  },
  {
    label: "Соф фоида",
    value: 17400,
    icon: "account_balance_wallet",
    iconClassName: "bg-primary-container text-on-primary-container",
    valueClassName: "text-primary",
    badge: "+28.5%",
    badgeIcon: "north_east",
    badgeTone: "primary",
    note: "афзоиши умумӣ",
    compact: {
      label: "Соф фоида",
      icon: "account_balance_wallet",
      iconClassName: "bg-primary-fixed text-on-primary-fixed",
      valueClassName: "text-primary",
      note: "+28.5% рушди моҳона",
      noteClassName: "text-primary",
    },
  },
];

export const monthFlow: DailyFlow[] = [
  { day: "17", income: 1950, expense: 1200 },
  { day: "18", income: 2400, expense: 1050 },
  { day: "19", income: 1500, expense: 1350 },
  { day: "20", income: 2700, expense: 1650 },
  { day: "21", income: 2100, expense: 900 },
  { day: "22", income: 2550, expense: 1440 },
  { day: "23", income: 1800, expense: 1800 },
  { day: "24", income: 1800, expense: 780, today: true },
];

export const weekFlow: DailyFlow[] = [
  { day: "Дш", income: 1950, expense: 1200 },
  { day: "Сш", income: 2250, expense: 1500 },
  { day: "Чш", income: 1500, expense: 1350 },
  { day: "Пш", income: 2700, expense: 1800 },
  { day: "Ҷм", income: 3000, expense: 1650, today: true },
  { day: "Шн", income: 2550, expense: 2100 },
  { day: "Як", income: 1200, expense: 900 },
];

export const expenseShares: ExpenseShare[] = [
  { label: "Ашёи хом", shortLabel: "Ашёи хом", percent: 55, amount: 17160, color: "#07644e" },
  { label: "Маоши кормандон", shortLabel: "Маош", percent: 25, amount: 7800, color: "#2e7d66" },
  { label: "Иҷораи ҷой", shortLabel: "Иҷора", percent: 12, amount: 3744, color: "#9c6400" },
  { label: "Дигар хароҷот", shortLabel: "Дигар", percent: 8, amount: 2496, color: "#bec9c3" },
];

export const expenseTotal = 31200;

export const recentTransactions: Transaction[] = [
  {
    id: "t1",
    title: "Орд (2 халта)",
    category: "Хӯрокворӣ",
    categoryTone: "neutral",
    time: "Имрӯз, 16:40",
    amount: -600,
    source: "voice",
    status: "Тасдиқ шуд",
    icon: "shopping_bag",
    iconClassName: "bg-surface-container-high text-on-surface",
  },
  {
    id: "t2",
    title: "Фурӯши ош ва чой",
    category: "Фурӯш",
    categoryTone: "primary",
    time: "Имрӯз, 16:35",
    amount: 1800,
    source: "voice",
    status: "Тасдиқ шуд",
    icon: "local_cafe",
    iconClassName: "bg-secondary-container text-on-secondary-container",
  },
  {
    id: "t3",
    title: "Роҳкиро / Такси",
    category: "Логистика",
    categoryTone: "neutral",
    time: "Имрӯз, 15:10",
    amount: -30,
    source: "manual",
    status: "Тасдиқ шуд",
    icon: "local_taxi",
    iconClassName: "bg-surface-container-high text-on-surface",
  },
  {
    id: "t4",
    title: "Маоши пешхизмат",
    category: "Маош",
    categoryTone: "neutral",
    time: "Имрӯз, 14:00",
    amount: -150,
    source: "voice",
    status: "Тасдиқ шуд",
    icon: "badge",
    iconClassName: "bg-tertiary-fixed text-on-tertiary-fixed",
  },
];


export const branchesCount = 8;

export function debtKpi(totals: { total: number; debtorCount: number; nearCount: number }): Kpi {
  const near = `${totals.nearCount} мӯҳлаташ наздик`;
  return {
    label: "Қарзи фаъол (Насия)",
    value: totals.total,
    icon: "menu_book",
    iconClassName: "bg-error-container text-on-error-container",
    valueClassName: "text-error",
    badge: near,
    badgeTone: "tertiary",
    note: `${totals.debtorCount} муштарӣ қарздоранд`,
    compact: {
      label: "Қарзи фаъол",
      icon: "schedule",
      iconClassName: "bg-tertiary-fixed text-on-tertiary-fixed",
      valueClassName: "text-tertiary",
      note: near,
      noteClassName: "text-error",
    },
  };
}
