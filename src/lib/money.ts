// Money is handled as integer dirams (1 somoni = 100 dirams), never as floating-point somoni.
// The API sends and accepts amounts as somoni strings such as "150.50".

export const DIRAMS_PER_SOMONI = 100;

const API_AMOUNT = /^(-?)(\d{1,13})\.(\d{2})$/;
const INPUT_AMOUNT = /^(\d{1,8})(?:[.,](\d{1,2}))?$/;

/** Parses an API amount ("150.50", "-40.05") into dirams. */
export function toDirams(amount: string): number {
  const match = API_AMOUNT.exec(amount);
  if (!match) throw new RangeError(`Unexpected amount format: ${amount}`);
  const [, sign, whole, fraction] = match;
  const value = Number(whole) * DIRAMS_PER_SOMONI + Number(fraction);
  return sign ? -value : value;
}

/** Parses what a person typed ("150", "150.5", "150,50") into dirams; null when it is not an amount. */
export function parseSomoniInput(text: string): number | null {
  const match = INPUT_AMOUNT.exec(text.trim());
  if (!match) return null;
  const [, whole, fraction = ""] = match;
  return Number(whole) * DIRAMS_PER_SOMONI + Number(fraction.padEnd(2, "0"));
}

/** Formats positive dirams the way the API expects them ("150.50"). */
export function toApiAmount(dirams: number): string {
  if (!Number.isSafeInteger(dirams) || dirams <= 0) throw new RangeError("Amount must be positive integer dirams");
  return `${Math.floor(dirams / DIRAMS_PER_SOMONI)}.${String(dirams % DIRAMS_PER_SOMONI).padStart(2, "0")}`;
}

/** Integer percentage of part in whole, rounded down. */
export function percentOf(part: number, whole: number) {
  return whole > 0 ? Math.floor((part * 100) / whole) : 0;
}
