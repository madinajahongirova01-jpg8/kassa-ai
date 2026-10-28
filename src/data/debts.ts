export type DebtEventType = "debt" | "payment";

export type DebtCustomer = {
  id: string;
  name: string;
  phone: string;
  note?: string;
  dueDate: string | null;
};

export type DebtEvent = {
  id: string;
  customerId: string;
  type: DebtEventType;
  note: string;
  tag: string;
  amount: number;
  date: string;
  time: string;
};

export const debtsToday = "2024-05-24";

export const debtCustomers: DebtCustomer[] = [
  { id: "c1", name: "Алишер Қосимов", phone: "+992 90 123 4567", note: "Чойхонаи марказӣ", dueDate: "2024-05-25" },
  { id: "c2", name: "Зафар Мирзоев", phone: "+992 93 555 7890", note: "муштарии доимӣ", dueDate: "2024-05-19" },
  { id: "c3", name: "Рустам Каримов", phone: "+992 98 777 2211", note: "ҳамсоя", dueDate: "2024-05-28" },
  { id: "c4", name: "Парвина Саидова", phone: "+992 91 888 3344", note: "муштарии нав", dueDate: "2024-05-30" },
  { id: "c5", name: "Фаррух Назаров", phone: "+992 92 444 1010", note: "муштарии доимӣ", dueDate: null },
];

export const debtEvents: DebtEvent[] = [
  { id: "e1", customerId: "c1", type: "debt", note: "Орд, 1 халта", tag: "Овозӣ", amount: 180, date: "2024-05-02", time: "09:12" },
  { id: "e2", customerId: "c1", type: "payment", note: "Пурра баргардонд", tag: "Нақд", amount: -180, date: "2024-05-12", time: "17:40" },
  { id: "e3", customerId: "c1", type: "debt", note: "Равған 2 қуттӣ, шакар", tag: "Овозӣ", amount: 220, date: "2024-05-20", time: "14:32" },
  { id: "e4", customerId: "c2", type: "debt", note: "Равған 2 л, шакар 3 кг", tag: "Дастӣ", amount: 180, date: "2024-05-12", time: "11:05" },
  { id: "e5", customerId: "c2", type: "payment", note: "Каме баргардонд", tag: "Нақд", amount: -35, date: "2024-05-15", time: "18:20" },
  { id: "e6", customerId: "c3", type: "debt", note: "Биринҷ ва нахӯд", tag: "Овозӣ", amount: 110, date: "2024-05-21", time: "16:20" },
  { id: "e7", customerId: "c4", type: "debt", note: "Чой ва қанд", tag: "Дастӣ", amount: 70, date: "2024-05-23", time: "12:40" },
  { id: "e8", customerId: "c5", type: "debt", note: "Орд ва равған", tag: "Овозӣ", amount: 200, date: "2024-05-10", time: "10:00" },
  { id: "e9", customerId: "c5", type: "payment", note: "Пурра баргардонд", tag: "Нақд", amount: -200, date: "2024-05-22", time: "18:10" },
];
