import type { ApiCashCategory } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/translate";
import type { SabtEntry } from "@/lib/sabt";

export function saveErrorKey(status: number): MessageKey {
  if (status === 400) return "sabt.errors.invalid";
  if (status === 401) return "sabt.errors.session";
  if (status === 403) return "sabt.errors.forbidden";
  if (status === 429) return "sabt.errors.tooMany";
  return "sabt.errors.server";
}

// parseSabt gives every category one Tajik note; the receipt shows that note in the chosen language.
const noteKeys: Partial<Record<ApiCashCategory, MessageKey>> = {
  GOODS: "sabt.notes.GOODS",
  TRANSPORT: "sabt.notes.TRANSPORT",
  SALARY: "sabt.notes.SALARY",
  SALE: "sabt.notes.SALE",
  RENT: "sabt.notes.RENT",
  OTHER: "sabt.notes.OTHER",
};

/** The receipt note for a cash entry, or undefined when only the parser's own note fits. */
export function sabtNoteKey(entry: Pick<SabtEntry, "category">): MessageKey | undefined {
  return noteKeys[entry.category];
}

export function receiptNoteKey(entry: Pick<SabtEntry, "category">): MessageKey | undefined {
  return entry.category === "UTILITIES" ? "sabt.notes.UTILITIES" : sabtNoteKey(entry);
}
