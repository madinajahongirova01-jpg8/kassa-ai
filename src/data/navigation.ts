import type { MessageKey } from "@/lib/i18n/translate";

export type NavItem = {
  labelKey: MessageKey;
  href: string;
  icon: string;
};

export const appNav: { labelKey: MessageKey; href: string }[] = [
  { labelKey: "nav.today", href: "/app" },
  { labelKey: "nav.ledger", href: "/app/transactions" },
  { labelKey: "nav.debts", href: "/app/debts" },
  { labelKey: "nav.reports", href: "/app/reports" },
];

export const liveDataRoutes = ["/app", "/app/new", "/app/transactions", "/app/debts", "/app/reports", "/app/settings"];

export const adminSidebarNav: NavItem[] = [
  { labelKey: "admin.overview", href: "/admin", icon: "analytics" },
];

export const adminMobileNav: NavItem[] = [
  { labelKey: "admin.dashboard", href: "/admin", icon: "dashboard" },
];
