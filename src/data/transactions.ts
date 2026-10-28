export type EntrySource = "voice" | "ai" | "manual" | "bank";
export type EntryCategory = "materials" | "sales" | "logistics" | "salary" | "debt" | "utilities";
export type PaymentMethod = "cash" | "qr" | "card" | "bank";
export type EntryKind = "income" | "expense";

export type LedgerEntry = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  category: EntryCategory;
  source: EntrySource;
  payment: PaymentMethod;
  amount: number;
  date: string;
  time: string;
  author: { name: string; initials: string; className: string };
  status: "confirmed" | "pending";
  voiceNote?: { text: string; duration: string };
  aiConfidence?: number;
};

export type CategoryMeta = {
  label: string;
  mobileLabel: string;
  formLabel: string;
  icon: string;
  formIcon: string;
  formIconClassName: string;
  iconClassName: string;
  pillClassName: string;
  dotClassName: string;
};

export const categories: Record<EntryCategory, CategoryMeta> = {
  materials: {
    label: "Мавод ва ашё",
    mobileLabel: "Мавод ва ашё",
    formLabel: "Мавод ва ашё",
    icon: "shopping_bag",
    formIcon: "inventory_2",
    formIconClassName: "text-tertiary",
    iconClassName: "bg-error-container text-on-error-container",
    pillClassName: "bg-surface-container-high text-on-surface-variant",
    dotClassName: "bg-tertiary",
  },
  sales: {
    label: "Фурӯши савдо",
    mobileLabel: "Савдо",
    formLabel: "Фурӯш",
    icon: "storefront",
    formIcon: "point_of_sale",
    formIconClassName: "text-primary",
    iconClassName: "bg-secondary-container text-on-secondary-fixed",
    pillClassName: "bg-secondary-container font-medium text-on-secondary-container",
    dotClassName: "bg-primary",
  },
  logistics: {
    label: "Логистика",
    mobileLabel: "Логистика",
    formLabel: "Логистика",
    icon: "local_shipping",
    formIcon: "local_shipping",
    formIconClassName: "text-secondary",
    iconClassName: "bg-surface-container-high text-on-surface-variant",
    pillClassName: "bg-surface-container-high text-on-surface-variant",
    dotClassName: "bg-outline",
  },
  salary: {
    label: "Маош",
    mobileLabel: "Маош ва подош",
    formLabel: "Маош",
    icon: "badge",
    formIcon: "payments",
    formIconClassName: "text-tertiary-container",
    iconClassName: "bg-error-container text-on-error-container",
    pillClassName: "bg-surface-container-high text-on-surface-variant",
    dotClassName: "bg-tertiary-container",
  },
  debt: {
    label: "Насия",
    mobileLabel: "Дафтари насия",
    formLabel: "Насия",
    icon: "menu_book",
    formIcon: "menu_book",
    formIconClassName: "text-primary",
    iconClassName: "bg-secondary-container text-on-secondary-fixed",
    pillClassName: "bg-primary-fixed font-medium text-on-primary-fixed",
    dotClassName: "bg-primary",
  },
  utilities: {
    label: "Иҷора ва коммуналӣ",
    mobileLabel: "Коммуналӣ",
    formLabel: "Иҷора ва Коммуналӣ",
    icon: "apartment",
    formIcon: "apartment",
    formIconClassName: "text-secondary",
    iconClassName: "bg-surface-container-high text-on-surface-variant",
    pillClassName: "bg-surface-container-high text-on-surface-variant",
    dotClassName: "bg-secondary",
  },
};

export const sources: Record<
  EntrySource,
  { label: string; mobileLabel: string; icon: string; iconClassName: string; tagClassName: string }
> = {
  voice: {
    label: "Овозӣ",
    mobileLabel: "Овоз",
    icon: "mic",
    iconClassName: "bg-primary-container text-on-primary-container",
    tagClassName: "bg-tertiary-fixed text-on-tertiary-fixed",
  },
  ai: {
    label: "AI чек",
    mobileLabel: "AI Автомат",
    icon: "smart_toy",
    iconClassName: "bg-tertiary-fixed text-on-tertiary-fixed",
    tagClassName: "bg-primary-fixed text-on-primary-fixed",
  },
  manual: {
    label: "Дастӣ",
    mobileLabel: "Дастӣ",
    icon: "edit_note",
    iconClassName: "bg-surface-container-high text-on-surface-variant",
    tagClassName: "bg-surface-container text-on-surface-variant",
  },
  bank: {
    label: "Бонк",
    mobileLabel: "Бонк",
    icon: "credit_card",
    iconClassName: "bg-secondary-container text-on-secondary-container",
    tagClassName: "bg-secondary-container text-on-secondary-container",
  },
};

export const inputMethods: { id: Exclude<EntrySource, "bank">; label: string; icon: string }[] = [
  { id: "voice", label: "Овозӣ", icon: "mic" },
  { id: "manual", label: "Дастӣ", icon: "edit_note" },
  { id: "ai", label: "Чек (AI)", icon: "document_scanner" },
];

export const paymentMethods: Record<PaymentMethod, string> = {
  cash: "Нақд (Касса)",
  qr: "QR-пардохт",
  card: "Корти бонкӣ",
  bank: "Ҳисоби бонкӣ",
};

export const ledgerToday = "2024-05-24";

export const periods = [
  { id: "today", label: "Имрӯз, 24 Май", mobileLabel: "Рӯзона", from: "2024-05-24", to: "2024-05-24" },
  { id: "yesterday", label: "Дирӯз, 23 Май", mobileLabel: "Дирӯз", from: "2024-05-23", to: "2024-05-23" },
  { id: "week", label: "Ҳафтаи ҷорӣ (20–24 Май)", mobileLabel: "Ҳафтаина", from: "2024-05-20", to: "2024-05-24" },
] as const;

export type PeriodId = (typeof periods)[number]["id"];

const owner = { name: "Ҷамшед Р.", initials: "ҶР", className: "bg-secondary-fixed text-on-secondary-fixed" };
const cashier = { name: "Алишер М.", initials: "АМ", className: "bg-surface-container-high text-on-surface" };
const waiter = { name: "Мавзуна", initials: "М", className: "bg-tertiary-fixed text-on-tertiary-fixed" };
const seller = { name: "Сӯҳроб", initials: "С", className: "bg-surface-container-highest text-on-surface" };

export const ledgerEntries: LedgerEntry[] = [
  {
    id: "1048",
    title: "Орд (2 халта, навъи якум)",
    shortTitle: "Орд (2 халта)",
    description: "Сабт тавассути микрофон (0:04с)",
    category: "materials",
    source: "voice",
    payment: "cash",
    amount: -600,
    date: "2024-05-24",
    time: "16:40",
    author: owner,
    status: "confirmed",
    voiceNote: { text: "Имрӯз 2 халта орд гирифтам 600 сомонӣ аз бозори Корвон", duration: "0:04" },
    aiConfidence: 98.9,
  },
  {
    id: "1047",
    title: "Фурӯши нисфирӯзӣ",
    shortTitle: "Фурӯши рӯз",
    description: "Ҳисоби ошхона ва нӯшокиҳо",
    category: "sales",
    source: "ai",
    payment: "cash",
    amount: 1800,
    date: "2024-05-24",
    time: "16:35",
    author: cashier,
    status: "confirmed",
    aiConfidence: 99.2,
  },
  {
    id: "1046",
    title: "Роҳкиро / Такси бор",
    shortTitle: "Такси боркашонӣ",
    description: "Интиқоли маҳсулот аз бозори «Саховат»",
    category: "logistics",
    source: "voice",
    payment: "cash",
    amount: -30,
    date: "2024-05-24",
    time: "15:10",
    author: owner,
    status: "confirmed",
    voiceNote: { text: "Такси барои бор аз бозори Саховат 30 сомонӣ додам", duration: "0:03" },
    aiConfidence: 97.1,
  },
  {
    id: "1045",
    title: "Пешпардохти маоши пешхизмат",
    shortTitle: "Маоши коргар",
    description: "Барои Мавзуна (басти рӯзона)",
    category: "salary",
    source: "manual",
    payment: "cash",
    amount: -150,
    date: "2024-05-24",
    time: "14:00",
    author: waiter,
    status: "confirmed",
  },
  {
    id: "1044",
    title: "Бозпардохти насия (Алишер Қ.)",
    shortTitle: "Бозпардохти насия",
    description: "Дафтари насия: сабти №104 пурра пӯшида шуд",
    category: "debt",
    source: "ai",
    payment: "cash",
    amount: 120,
    date: "2024-05-24",
    time: "11:20",
    author: owner,
    status: "confirmed",
    aiConfidence: 98.4,
  },
  {
    id: "1043",
    title: "Чойи кабуд ва шириниҳо",
    shortTitle: "Чой ва шириниҳо",
    description: "Пардохт тавассути QR-код",
    category: "sales",
    source: "bank",
    payment: "qr",
    amount: 85,
    date: "2024-05-24",
    time: "10:45",
    author: seller,
    status: "confirmed",
  },
  {
    id: "1042",
    title: "Хариди равған ва шакар",
    shortTitle: "Равған ва шакар",
    description: "5 литр равған, 10 кг шакар барои пухтупаз",
    category: "materials",
    source: "manual",
    payment: "cash",
    amount: -240,
    date: "2024-05-24",
    time: "09:15",
    author: owner,
    status: "confirmed",
  },
  {
    id: "1041",
    title: "Фурӯши шом",
    shortTitle: "Фурӯши шом",
    description: "Ош, кабоб ва нӯшокиҳо",
    category: "sales",
    source: "ai",
    payment: "cash",
    amount: 1240,
    date: "2024-05-23",
    time: "20:10",
    author: cashier,
    status: "confirmed",
    aiConfidence: 98.7,
  },
  {
    id: "1040",
    title: "Пардохти барқ",
    shortTitle: "Пардохти барқ",
    description: "Ҳисоби барқ барои моҳи апрел",
    category: "utilities",
    source: "manual",
    payment: "bank",
    amount: -180,
    date: "2024-05-23",
    time: "18:30",
    author: owner,
    status: "confirmed",
  },
  {
    id: "1039",
    title: "Гӯшти гов (5 кг)",
    shortTitle: "Гӯшти гов",
    description: "Хариди гӯшт аз бозори Меҳргон",
    category: "materials",
    source: "voice",
    payment: "cash",
    amount: -400,
    date: "2024-05-23",
    time: "13:05",
    author: owner,
    status: "confirmed",
    voiceNote: { text: "Панҷ кило гӯшти гов гирифтам 400 сомонӣ", duration: "0:05" },
    aiConfidence: 97.8,
  },
  {
    id: "1038",
    title: "Фурӯши нисфирӯзӣ",
    shortTitle: "Фурӯши рӯз",
    description: "Ҳисоби ошхона ва нӯшокиҳо",
    category: "sales",
    source: "ai",
    payment: "card",
    amount: 520,
    date: "2024-05-23",
    time: "13:00",
    author: cashier,
    status: "confirmed",
    aiConfidence: 99.0,
  },
  {
    id: "1037",
    title: "Такси барои мол",
    shortTitle: "Такси",
    description: "Овардани сабзавот аз бозор",
    category: "logistics",
    source: "voice",
    payment: "cash",
    amount: -25,
    date: "2024-05-23",
    time: "09:40",
    author: owner,
    status: "pending",
    voiceNote: { text: "Такси барои сабзавот 25 сомонӣ", duration: "0:02" },
    aiConfidence: 96.5,
  },
  {
    id: "1036",
    title: "Иҷораи ҷой",
    shortTitle: "Иҷораи ҷой",
    description: "Иҷораи моҳи май",
    category: "utilities",
    source: "manual",
    payment: "bank",
    amount: -1500,
    date: "2024-05-22",
    time: "10:00",
    author: owner,
    status: "confirmed",
  },
  {
    id: "1035",
    title: "Фурӯши рӯз",
    shortTitle: "Фурӯши рӯз",
    description: "Ҳисоби умумии рӯз",
    category: "sales",
    source: "ai",
    payment: "cash",
    amount: 2100,
    date: "2024-05-22",
    time: "21:00",
    author: cashier,
    status: "confirmed",
    aiConfidence: 98.6,
  },
];
