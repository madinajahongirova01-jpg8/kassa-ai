import { InlineKeyboard } from "grammy";

export function confirmKeyboard(
  transactionId: number,
  confirmLabel: string,
  cancelLabel: string,
): InlineKeyboard {
  return new InlineKeyboard()
    .text(confirmLabel, `tx:confirm:${transactionId}`)
    .text(cancelLabel, `tx:cancel:${transactionId}`);
}