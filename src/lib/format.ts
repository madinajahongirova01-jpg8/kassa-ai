const groupFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

export function formatNumber(value: number) {
  return groupFormatter.format(value).replace(/\s/g, " ");
}

export function formatSomoni(value: number, options: { sign?: boolean; unit?: boolean } = {}) {
  const { sign = false, unit = true } = options;
  const prefix = sign ? (value > 0 ? "+" : value < 0 ? "-" : "") : value < 0 ? "-" : "";
  const body = formatNumber(Math.abs(value));
  return `${prefix}${body}${unit ? " смн" : ""}`;
}
