export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export const appNav: Omit<NavItem, "icon">[] = [
  { label: "Имрӯз", href: "/app" },
  { label: "Дафтар", href: "/app/transactions" },
  { label: "Насия", href: "/app/debts" },
  { label: "Ҳисобот", href: "/app/reports" },
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
