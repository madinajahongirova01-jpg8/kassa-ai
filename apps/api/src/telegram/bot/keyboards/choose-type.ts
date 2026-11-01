import { InlineKeyboard } from "grammy";

export function chooseTypeKeyboard(
  key: string,
  saleLabel: string,
  expenseLabel: string,
  creditLabel: string,
): InlineKeyboard {
  return new InlineKeyboard()
    .text(saleLabel, `pick:${key}:sale`)
    .text(expenseLabel, `pick:${key}:expense`)
    .row()
    .text(creditLabel, `pick:${key}:credit`);
}