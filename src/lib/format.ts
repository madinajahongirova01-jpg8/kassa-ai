type FormatOptions = {
  sign?: boolean;
  unit?: boolean;
  decimals?: number;
};

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
  const { sign = false, unit = true, decimals = 0 } = options;
  const prefix = value < 0 ? "-" : sign && value > 0 ? "+" : "";
  return `${prefix}${formatNumber(Math.abs(value), decimals)}${unit ? " смн" : ""}`;
}
