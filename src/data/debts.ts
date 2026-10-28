export type DebtEventType = "debt" | "payment" | "reminder";

export type DebtCustomer = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  place?: string;
  address?: string;
  vip?: boolean;
  limit: number;
  dueDate: string | null;
  reliability: number;
  avatarClassName: string;
  mobileAvatarClassName: string;
};

export type DebtEvent = {
  id: string;
  customerId: string;
  type: DebtEventType;
  title: string;
  note: string;
  tag: string;
  amount: number;
  date: string;
  time: string;
  read?: boolean;
};

export type DebtReceiptItem = {
  name: string;
  quantity: string;
  price: number;
  total: number;
};

export type DebtReceipt = {
  id: string;
  customerId: string;
  date: string;
  time: string;
  place: string;
  source: "voice" | "manual";
  signedBy: string;
  items: DebtReceiptItem[];
};

export const debtsToday = "2024-05-24";

export const repaymentMethods = ["Нақд", "Корти бонкӣ", "Интиқол"] as const;
export type RepaymentMethod = (typeof repaymentMethods)[number];

export const debtCustomers: DebtCustomer[] = [
  {
    id: "c1",
    name: "Алишер Қосимов",
    initials: "АҚ",
    phone: "+992 90 123 4567",
    place: "Чойхонаи марказӣ",
    address: "Душанбе, кӯч. Рӯдакӣ 45, Чойхона",
    vip: true,
    limit: 1000,
    dueDate: "2024-05-25",
    reliability: 98,
    avatarClassName: "bg-primary text-on-primary",
    mobileAvatarClassName: "bg-primary-fixed text-on-primary-fixed",
  },
  {
    id: "c2",
    name: "Зафар Мирзоев",
    initials: "ЗМ",
    phone: "+992 93 555 7890",
    place: "Дӯкони рақами 4",
    address: "Душанбе, бозори Корвон, дӯкони 4",
    limit: 500,
    dueDate: "2024-05-19",
    reliability: 72,
    avatarClassName: "bg-error-container text-on-error-container",
    mobileAvatarClassName: "bg-error-container text-on-error-container",
  },
  {
    id: "c3",
    name: "Рустам Каримов",
    initials: "РК",
    phone: "+992 98 777 2211",
    address: "Душанбе, н. Шоҳмансур",
    limit: 600,
    dueDate: "2024-05-28",
    reliability: 95,
    avatarClassName: "bg-surface-container-highest text-on-surface-variant",
    mobileAvatarClassName: "bg-surface-container-high text-on-surface-variant",
  },
  {
    id: "c4",
    name: "Парвина Саидова",
    initials: "ПС",
    phone: "+992 91 888 3344",
    address: "Душанбе, кӯч. Айнӣ 12",
    limit: 400,
    dueDate: "2024-05-30",
    reliability: 96,
    avatarClassName: "bg-surface-container-highest text-on-surface-variant",
    mobileAvatarClassName: "bg-surface-container-high text-on-surface-variant",
  },
  {
    id: "c5",
    name: "Маҳмуд Бобоев",
    initials: "МБ",
    phone: "+992 92 444 1122",
    address: "Душанбе, н. Фирдавсӣ",
    limit: 500,
    dueDate: null,
    reliability: 100,
    avatarClassName: "bg-secondary-container text-on-secondary-container",
    mobileAvatarClassName: "bg-secondary-container text-on-secondary-container",
  },
  {
    id: "c6",
    name: "Нигина Раҳимова",
    initials: "НР",
    phone: "+992 90 310 2244",
    address: "Душанбе, кӯч. Бохтар 8",
    limit: 700,
    dueDate: null,
    reliability: 99,
    avatarClassName: "bg-secondary-container text-on-secondary-container",
    mobileAvatarClassName: "bg-secondary-container text-on-secondary-container",
  },
  {
    id: "c7",
    name: "Фарҳод Шарипов",
    initials: "ФШ",
    phone: "+992 93 207 6655",
    address: "Душанбе, н. Сино",
    limit: 400,
    dueDate: null,
    reliability: 97,
    avatarClassName: "bg-secondary-container text-on-secondary-container",
    mobileAvatarClassName: "bg-secondary-container text-on-secondary-container",
  },
  {
    id: "c8",
    name: "Шаҳло Юсупова",
    initials: "ШЮ",
    phone: "+992 98 121 9090",
    address: "Душанбе, кӯч. Исмоили Сомонӣ 30",
    limit: 800,
    dueDate: null,
    reliability: 95,
    avatarClassName: "bg-secondary-container text-on-secondary-container",
    mobileAvatarClassName: "bg-secondary-container text-on-secondary-container",
  },
];

export const debtEvents: DebtEvent[] = [
  { id: "e1", customerId: "c1", type: "debt", title: "Мол ба насия дода шуд", note: "1 халта орд «Қазоқистон» (180 смн)", tag: "Қайди дастӣ", amount: 180, date: "2024-05-02", time: "09:12" },
  { id: "e2", customerId: "c1", type: "payment", title: "Қарзи пешина пардохт шуд", note: "Пардохти пурраи насияи орд аз 2 май.", tag: "Нақд", amount: -180, date: "2024-05-12", time: "17:40" },
  { id: "e3", customerId: "c1", type: "debt", title: "Мол ба насия дода шуд", note: "2 қуттӣ равған + 1 халта шакар. Фурӯшанда: Ҷамшед Раҳимов", tag: "Сабти овозӣ", amount: 220, date: "2024-05-20", time: "14:32" },
  { id: "e4", customerId: "c1", type: "reminder", title: "Огоҳинома фиристода шуд", note: "Матн: «Салом Алишер, ёдовар мешавем, ки мӯҳлати насияи 220 смн то 25 май мебошад...»", tag: "Telegram", amount: 0, date: "2024-05-22", time: "10:15", read: true },
  { id: "e5", customerId: "c2", type: "debt", title: "Мол ба насия дода шуд", note: "Маҳсулоти хушк барои дӯкон", tag: "Қайди дастӣ", amount: 145, date: "2024-05-12", time: "11:05" },
  { id: "e6", customerId: "c3", type: "debt", title: "Мол ба насия дода шуд", note: "Биринҷ ва нахӯд", tag: "Сабти овозӣ", amount: 110, date: "2024-05-21", time: "16:20" },
  { id: "e7", customerId: "c4", type: "debt", title: "Мол ба насия дода шуд", note: "Чой ва қанд", tag: "Қайди дастӣ", amount: 70, date: "2024-05-23", time: "12:40" },
  { id: "e8", customerId: "c5", type: "debt", title: "Мол ба насия дода шуд", note: "Равғани пахта (5 л)", tag: "Қайди дастӣ", amount: 90, date: "2024-05-06", time: "10:00" },
  { id: "e9", customerId: "c5", type: "payment", title: "Қарз пурра пардохт шуд", note: "Пардохт дар дӯкон", tag: "Нақд", amount: -90, date: "2024-05-15", time: "18:10" },
  { id: "e10", customerId: "c6", type: "debt", title: "Мол ба насия дода шуд", note: "Орд ва равған", tag: "Сабти овозӣ", amount: 300, date: "2024-05-03", time: "09:30" },
  { id: "e11", customerId: "c6", type: "payment", title: "Қарз пурра пардохт шуд", note: "Интиқол ба корт", tag: "Корти бонкӣ", amount: -300, date: "2024-05-17", time: "13:15" },
  { id: "e12", customerId: "c7", type: "debt", title: "Мол ба насия дода шуд", note: "Маводи шустушӯй", tag: "Қайди дастӣ", amount: 150, date: "2024-05-08", time: "15:00" },
  { id: "e13", customerId: "c7", type: "payment", title: "Қарз пурра пардохт шуд", note: "Пардохт дар дӯкон", tag: "Нақд", amount: -150, date: "2024-05-18", time: "19:20" },
  { id: "e14", customerId: "c8", type: "debt", title: "Мол ба насия дода шуд", note: "Хариди калон барои тӯй", tag: "Қайди дастӣ", amount: 660, date: "2024-04-05", time: "11:00" },
  { id: "e15", customerId: "c8", type: "payment", title: "Қарз пурра пардохт шуд", note: "Пардохт дар дӯкон", tag: "Нақд", amount: -660, date: "2024-04-25", time: "17:30" },
  { id: "e16", customerId: "c8", type: "debt", title: "Мол ба насия дода шуд", note: "Шакар ва чой", tag: "Сабти овозӣ", amount: 60, date: "2024-05-10", time: "10:45" },
  { id: "e17", customerId: "c8", type: "payment", title: "Қарз пурра пардохт шуд", note: "Пардохт дар дӯкон", tag: "Нақд", amount: -60, date: "2024-05-20", time: "18:00" },
];

export const debtReceipts: DebtReceipt[] = [
  {
    id: "1042",
    customerId: "c1",
    date: "2024-05-20",
    time: "14:32",
    place: "Душанбе, Дӯкони марказӣ",
    source: "voice",
    signedBy: "Алишер Қ.",
    items: [
      { name: "2 қуттӣ равған (Олейна, 5л)", quantity: "2 дона", price: 80, total: 160 },
      { name: "1 халта шакар (Ховалинг, 25кг)", quantity: "1 халта", price: 60, total: 60 },
    ],
  },
  {
    id: "1039",
    customerId: "c3",
    date: "2024-05-21",
    time: "16:20",
    place: "Душанбе, Дӯкони марказӣ",
    source: "voice",
    signedBy: "Рустам К.",
    items: [
      { name: "Биринҷи «Лазер» (10кг)", quantity: "1 халта", price: 80, total: 80 },
      { name: "Нахӯд (2кг)", quantity: "2 кг", price: 15, total: 30 },
    ],
  },
];
