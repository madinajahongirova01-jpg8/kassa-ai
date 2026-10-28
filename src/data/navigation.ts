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

export const adminSidebarNav: NavItem[] = [
  { label: "Шарҳи умумӣ", href: "/admin", icon: "analytics" },
  { label: "Бизнесҳо", href: "/admin/businesses", icon: "storefront" },
  { label: "Сифати AI", href: "/admin/ai", icon: "graphic_eq" },
  { label: "Маркази дастгирӣ", href: "/admin/support", icon: "support_agent" },
  { label: "Журнали аудити система", href: "/admin/audit", icon: "security_update_good" },
];

export const adminMobileNav: NavItem[] = [
  { label: "Дашборд", href: "/admin", icon: "dashboard" },
  { label: "Бизнесҳо", href: "/admin/businesses", icon: "store" },
  { label: "Сифати AI", href: "/admin/ai", icon: "psychology" },
  { label: "Дастгирӣ", href: "/admin/support", icon: "headset_mic" },
  { label: "Журнал", href: "/admin/audit", icon: "receipt_long" },
];
