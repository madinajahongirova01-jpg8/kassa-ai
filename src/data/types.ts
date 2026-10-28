export type Tone = "primary" | "secondary" | "tertiary" | "error" | "neutral" | "warning";

export type ReceiptLine = {
  label: string;
  amount: number;
};

export type Receipt = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  lines: ReceiptLine[];
};

export type Kpi = {
  label: string;
  value: number;
  icon: string;
  iconClassName: string;
  valueClassName: string;
  badge: string;
  badgeIcon?: string;
  badgeTone: Tone;
  note: string;
  compact: {
    label: string;
    icon: string;
    iconClassName: string;
    valueClassName: string;
    note: string;
    noteClassName: string;
  };
};

export type DailyFlow = {
  day: string;
  income: number;
  expense: number;
  today?: boolean;
};

export type ExpenseShare = {
  label: string;
  shortLabel: string;
  percent: number;
  amount: number;
  color: string;
};

export type TransactionSource = "voice" | "manual" | "telegram";

export type Transaction = {
  id: string;
  title: string;
  category: string;
  categoryTone: Tone;
  time: string;
  amount: number;
  source: TransactionSource;
  status: string;
  icon: string;
  iconClassName: string;
};

export type DueDebt = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  amount: number;
  due: string;
  dueShort: string;
  avatarClassName: string;
  dueClassName: string;
};
