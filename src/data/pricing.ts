export type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  audience: string;
  main?: boolean;
};

export const plans: Plan[] = [
  { id: "ogoz", name: "Оғоз", price: "Ройгон", period: "7 рӯз", audience: "Барои санҷиш ва шинос шудан бо барнома" },
  { id: "tijorat", name: "Тиҷорат", price: "69", period: "смн / моҳ", audience: "Барои дӯконҳо ва нуқтаҳои савдо дар бозор", main: true },
  { id: "pro", name: "Pro", price: "149", period: "смн / моҳ", audience: "Барои қаҳвахонаҳо ва супермаркетҳои маҳаллӣ" },
  { id: "shabaka", name: "Шабака", price: "Бо созиш", period: "нарх бо шартнома", audience: "Барои шабакаи мағозаҳо ва яклухтфурӯшон" },
];

export const appFeatures = [
  { title: "Сабти нав", note: "бо матн; овоз ва акси чек — ба наздикӣ", href: "/app/new" },
  { title: "Имрӯз", note: "фоидаи рӯз дар як ҷумла", href: "/app" },
  { title: "Дафтар", note: "ҳамаи сабтҳо рӯз ба рӯз", href: "/app/transactions" },
  { title: "Насия", note: "кӣ ба шумо чӣ қадар қарздор аст", href: "/app/debts" },
  { title: "Ҳисобот", note: "ҳафта ва моҳ дар як нигоҳ", href: "/app/reports" },
];
