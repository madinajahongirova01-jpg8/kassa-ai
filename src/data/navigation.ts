export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export const appSidebarNav: NavItem[] = [
  { label: "Шарҳ", href: "/app", icon: "dashboard" },
  { label: "Амалиётҳо", href: "/app/transactions", icon: "receipt_long" },
  { label: "Насия", href: "/app/debts", icon: "menu_book" },
  { label: "Ҳисоботҳо", href: "/app/reports", icon: "query_stats" },
  { label: "Категорияҳо", href: "#", icon: "category" },
  { label: "Кормандон", href: "#", icon: "badge" },
  { label: "Филиалҳо", href: "#", icon: "storefront" },
  { label: "Обуна ва Ҳисоб", href: "#", icon: "credit_card" },
  { label: "Танзимот", href: "/app/settings", icon: "settings" },
];

export const appMobileNav: NavItem[] = [
  { label: "Шарҳ", href: "/app", icon: "dashboard" },
  { label: "Амалиётҳо", href: "/app/transactions", icon: "receipt_long" },
  { label: "Насия", href: "/app/debts", icon: "menu_book" },
  { label: "Танзимот", href: "/app/settings", icon: "tune" },
];
