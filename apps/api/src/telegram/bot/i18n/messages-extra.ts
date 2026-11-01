import type { Lang } from "../types/language";

export interface ExtraMessages {
  reminder: (lines: string, total: string) => string;
  linkCode: (code: string, minutes: number) => string;
  askType: (amount: string) => string;
  pickSale: string;
  pickExpense: string;
  pickCredit: string;
  choiceExpired: string;
  needAmount: string;
}

const tg: ExtraMessages = {
  reminder: (lines, total) =>
    `⏰ Ёдоварӣ\n\nҚарзҳои дер монда (зиёда аз 30 рӯз):\n${lines}\n\nҶамъ: ${total}\n\nИн паём танҳо барои шумост. Ба қарздорон ҳеҷ чиз фиристода намешавад.`,
  linkCode: (code, minutes) =>
    `🔗 Рамзи пайвастшавӣ: ${code}\n\nИн рамз ${minutes} дақиқа эътибор дорад ва танҳо як бор кор мекунад. Онро ба касе нагӯед.`,
  askType: (amount) => `Маблағ: ${amount}\n\nИн чист?`,
  pickSale: "💰 Фурӯш",
  pickExpense: "🧾 Хароҷот",
  pickCredit: "📒 Нася",
  choiceExpired: "Ин интихоб кӯҳна шуд. Паёмро аз нав нависед.",
  needAmount: "Маблағро ҳам нависед 🙂\n\nМасалан: нон 50 сомонӣ",
};

const ru: ExtraMessages = {
  reminder: (lines, total) =>
    `⏰ Напоминание\n\nПросроченные долги (больше 30 дней):\n${lines}\n\nИтого: ${total}\n\nЭто сообщение только для вас. Должникам ничего не отправляется.`,
  linkCode: (code, minutes) =>
    `🔗 Код привязки: ${code}\n\nКод действует ${minutes} минут и работает только один раз. Никому его не сообщайте.`,
  askType: (amount) => `Сумма: ${amount}\n\nЧто это?`,
  pickSale: "💰 Продажа",
  pickExpense: "🧾 Расход",
  pickCredit: "📒 В долг",
  choiceExpired: "Этот выбор устарел. Напишите сообщение заново.",
  needAmount: "Укажите ещё сумму 🙂\n\nНапример: хлеб 50 сомони",
};

const en: ExtraMessages = {
  reminder: (lines, total) =>
    `⏰ Reminder\n\nOverdue debts (more than 30 days):\n${lines}\n\nTotal: ${total}\n\nThis message is only for you. Nothing is sent to debtors.`,
  linkCode: (code, minutes) =>
    `🔗 Linking code: ${code}\n\nThe code is valid for ${minutes} minutes and works only once. Do not share it with anyone.`,
  askType: (amount) => `Amount: ${amount}\n\nWhat is this?`,
  pickSale: "💰 Sale",
  pickExpense: "🧾 Expense",
  pickCredit: "📒 Credit",
  choiceExpired: "This choice has expired. Please write the message again.",
  needAmount: "Please add the amount too 🙂\n\nFor example: bread 50 somoni",
};

export const MESSAGES_EXTRA: Record<Lang, ExtraMessages> = { tg, ru, en };