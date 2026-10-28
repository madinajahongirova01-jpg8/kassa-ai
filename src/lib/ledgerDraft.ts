import { ledgerToday, type EntryCategory, type EntrySource, type LedgerEntry, type PaymentMethod } from "@/data/transactions";

export type EntryDraft = {
  id: string | null;
  kind: "income" | "expense";
  amount: string;
  category: EntryCategory;
  title: string;
  source: EntrySource;
  payment: PaymentMethod;
  date: string;
  time: string;
};

export function draftFromEntry(entry: LedgerEntry): EntryDraft {
  return {
    id: entry.id,
    kind: entry.amount < 0 ? "expense" : "income",
    amount: String(Math.abs(entry.amount)),
    category: entry.category,
    title: entry.title,
    source: entry.source,
    payment: entry.payment,
    date: entry.date,
    time: entry.time,
  };
}

export function emptyDraft(now: Date): EntryDraft {
  return {
    id: null,
    kind: "expense",
    amount: "",
    category: "materials",
    title: "",
    source: "manual",
    payment: "cash",
    date: ledgerToday,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  };
}

export function draftAmount(draft: EntryDraft) {
  const value = Number(draft.amount || 0);
  return draft.kind === "expense" ? -value : value;
}

export function isDraftValid(draft: EntryDraft) {
  return Number(draft.amount) > 0 && draft.title.trim().length > 0;
}

export function applyDraft(draft: EntryDraft, base: LedgerEntry | undefined, nextId: string): LedgerEntry {
  const title = draft.title.trim();
  return {
    id: draft.id ?? nextId,
    title,
    shortTitle: base && base.title === title ? base.shortTitle : title,
    description: base?.description ?? "Сабти дастӣ",
    category: draft.category,
    source: draft.source,
    payment: draft.payment,
    amount: draftAmount(draft),
    date: draft.date,
    time: draft.time,
    author: base?.author ?? { name: "Ҷамшед Р.", initials: "ҶР", className: "bg-secondary-fixed text-on-secondary-fixed" },
    status: "confirmed",
    voiceNote: base?.voiceNote,
    aiConfidence: base?.aiConfidence,
  };
}
