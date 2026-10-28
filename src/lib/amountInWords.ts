const ones = ["", "як", "ду", "се", "чор", "панҷ", "шаш", "ҳафт", "ҳашт", "нӯҳ"];
const teens = ["даҳ", "ёздаҳ", "дувоздаҳ", "сенздаҳ", "чордаҳ", "понздаҳ", "шонздаҳ", "ҳабдаҳ", "ҳаждаҳ", "нуздаҳ"];
const tens = ["", "", "бист", "сӣ", "чил", "панҷоҳ", "шаст", "ҳафтод", "ҳаштод", "навад"];

function join(parts: string[]) {
  return parts.reduce((result, part, index) => {
    if (index === 0) return part;
    const joiner = /[аеиоуӯӣяю]$/.test(result) ? "ю " : "у ";
    return `${result}${joiner}${part}`;
  }, "");
}

function belowThousand(value: number) {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  if (hundreds > 0) parts.push(hundreds === 1 ? "сад" : `${ones[hundreds]}сад`);
  if (rest >= 10 && rest < 20) {
    parts.push(teens[rest - 10]);
  } else {
    if (Math.floor(rest / 10) > 0) parts.push(tens[Math.floor(rest / 10)]);
    if (rest % 10 > 0) parts.push(ones[rest % 10]);
  }
  return parts;
}

export function amountInWords(value: number) {
  const amount = Math.floor(Math.abs(value));
  if (amount === 0) return "Сифр сомонӣ";
  const thousands = Math.floor(amount / 1000);
  const parts: string[] = [];
  if (thousands > 0) parts.push(thousands === 1 ? "ҳазор" : `${join(belowThousand(thousands))} ҳазор`);
  parts.push(...belowThousand(amount % 1000));
  const text = join(parts);
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} сомонӣ`;
}
