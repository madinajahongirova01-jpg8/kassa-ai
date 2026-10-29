// Amounts are handled as integer dirams (1 somoni = 100 dirams) and never as floating-point somoni.
export const DIRAMS_PER_SOMONI = 100;
export const MAX_AMOUNT_DIRAMS = 1_000_000_000;

const SOMONI_PATTERN = /^(\d{1,8})(?:\.(\d{1,2}))?$/;

/**
 * Parses a somoni amount such as "150", "150.5" or "150.50" into dirams without float arithmetic.
 * Numbers are accepted only when their decimal representation matches the same format.
 */
export function parseSomoni(value: unknown): number | undefined {
  let text: string;
  if (typeof value === 'string') {
    text = value.trim();
  } else if (typeof value === 'number' && Number.isFinite(value)) {
    text = String(value);
  } else {
    return undefined;
  }

  const match = SOMONI_PATTERN.exec(text);
  if (match === null) {
    return undefined;
  }
  const [, whole, fraction = ''] = match;
  return Number(whole) * DIRAMS_PER_SOMONI + Number(fraction.padEnd(2, '0'));
}

export function formatDirams(dirams: number): string {
  if (!Number.isSafeInteger(dirams)) {
    throw new RangeError('Amount in dirams must be a safe integer');
  }
  const sign = dirams < 0 ? '-' : '';
  const absolute = Math.abs(dirams);
  const whole = Math.floor(absolute / DIRAMS_PER_SOMONI);
  const fraction = String(absolute % DIRAMS_PER_SOMONI).padStart(2, '0');
  return `${sign}${whole}.${fraction}`;
}
