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

export const liveDataRoutes = ["/app", "/app/debts"];

export const adminSidebarNav: NavItem[] = [
  { label: "Шарҳи умумӣ", href: "/admin", icon: "analytics" },
];

export const adminMobileNav: NavItem[] = [
  { label: "Дашборд", href: "/admin", icon: "dashboard" },
];
