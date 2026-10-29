type FormatOptions = {
  sign?: boolean;
  unit?: boolean;
};

export const MINUS = "−";

export function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
    .format(value)
    .replace(/\s/g, " ")
    .replace(",", ".");
}

export function formatSomoni(value: number, options: FormatOptions = {}) {
  const { sign = false, unit = true } = options;
  const prefix = value < 0 ? MINUS : sign && value > 0 ? "+" : "";
  return `${prefix}${formatNumber(Math.round(Math.abs(value)))}${unit ? " смн" : ""}`;
}

/** Like formatSomoni, but for exact integer dirams: "1 250", "1 250.50". */
export function formatMoney(dirams: number, options: FormatOptions = {}) {
  const { sign = false, unit = true } = options;
  const prefix = dirams < 0 ? MINUS : sign && dirams > 0 ? "+" : "";
  const absolute = Math.abs(dirams);
  const fraction = absolute % 100;
  const cents = fraction === 0 ? "" : `.${String(fraction).padStart(2, "0")}`;
  return `${prefix}${formatNumber(Math.floor(absolute / 100))}${cents}${unit ? " смн" : ""}`;
}

export const monthNames = ["январ", "феврал", "март", "апрел", "май", "июн", "июл", "август", "сентябр", "октябр", "ноябр", "декабр"];

export function formatDayMonth(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return `${day} ${monthNames[month - 1]}`;
}
