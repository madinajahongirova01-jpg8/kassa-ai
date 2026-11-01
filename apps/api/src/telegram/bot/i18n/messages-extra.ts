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
  customerNotFound: string;
  customerAmbiguous: string;
  noOpenDebts: string;
  exceedsDebt: (remaining: string) => string;
  amountTooLarge: string;
  saveFailed: string;
  tooManyMessages: string;
}

const tg: ExtraMessages = {
  reminder: (lines, total) =>
    `⏰ Ёдоварӣ\n\nҚарзҳое, ки мӯҳлаташон гузаштааст:\n${lines}\n\nҶамъ: ${total}\n\nИн паём танҳо барои шумост. Ба қарздорон ҳеҷ чиз фиристода намешавад.`,
  linkCode: (code, minutes) =>
    `🔗 Рамзи пайвастшавӣ: ${code}\n\nИн рамз ${minutes} дақиқа эътибор дорад ва танҳо як бор кор мекунад. Онро ба касе нагӯед.`,
  askType: (amount) => `Маблағ: ${amount}\n\nИн чист?`,
  pickSale: "💰 Фурӯш",
  pickExpense: "🧾 Хароҷот",
  pickCredit: "📒 Нася",
  choiceExpired: "Ин интихоб кӯҳна шуд. Паёмро аз нав нависед.",
  needAmount: "Маблағро ҳам нависед 🙂\n\nМасалан: нон 50 сомонӣ",
  customerNotFound: "Ин муштарӣ дар Kassa ёфт нашуд. Номро санҷед ва аз нав нависед. Сабт нашуд.",
  customerAmbiguous: "Дар Kassa якчанд муштарӣ бо ҳамин ном ҳаст. Инро дар сайт сабт кунед. Сабт нашуд.",
  noOpenDebts: "Ин муштарӣ қарз надорад. Сабт нашуд.",
  exceedsDebt: (remaining) => `Маблағ аз қарз зиёд аст. Ин муштарӣ ҳамагӣ ${remaining} қарздор аст. Сабт нашуд.`,
  amountTooLarge: "Маблағ хеле калон аст. Сабт нашуд.",
  saveFailed: "Хато шуд, сабт нашуд. Каме баъдтар боз кӯшиш кунед.",
  tooManyMessages: "Паёмҳо хеле зиёданд. Як дақиқа сабр кунед ва баъд боз нависед.",
};

const ru: ExtraMessages = {
  reminder: (lines, total) =>
    `⏰ Напоминание\n\nДолги с истёкшим сроком:\n${lines}\n\nИтого: ${total}\n\nЭто сообщение только для вас. Должникам ничего не отправляется.`,
  linkCode: (code, minutes) =>
    `🔗 Код привязки: ${code}\n\nКод действует ${minutes} минут и работает только один раз. Никому его не сообщайте.`,
  askType: (amount) => `Сумма: ${amount}\n\nЧто это?`,
  pickSale: "💰 Продажа",
  pickExpense: "🧾 Расход",
  pickCredit: "📒 В долг",
  choiceExpired: "Этот выбор устарел. Напишите сообщение заново.",
  needAmount: "Укажите ещё сумму 🙂\n\nНапример: хлеб 50 сомони",
  customerNotFound: "Этот клиент не найден в Kassa. Проверьте имя и напишите заново. Не сохранено.",
  customerAmbiguous: "В Kassa несколько клиентов с таким именем. Внесите эту запись на сайте. Не сохранено.",
  noOpenDebts: "У этого клиента нет долга. Не сохранено.",
  exceedsDebt: (remaining) => `Сумма больше долга. Этот клиент должен всего ${remaining}. Не сохранено.`,
  amountTooLarge: "Слишком большая сумма. Не сохранено.",
  saveFailed: "Произошла ошибка, запись не сохранена. Попробуйте чуть позже.",
  tooManyMessages: "Слишком много сообщений. Подождите минуту и напишите снова.",
};

const en: ExtraMessages = {
  reminder: (lines, total) =>
    `⏰ Reminder\n\nDebts past their due date:\n${lines}\n\nTotal: ${total}\n\nThis message is only for you. Nothing is sent to debtors.`,
  linkCode: (code, minutes) =>
    `🔗 Linking code: ${code}\n\nThe code is valid for ${minutes} minutes and works only once. Do not share it with anyone.`,
  askType: (amount) => `Amount: ${amount}\n\nWhat is this?`,
  pickSale: "💰 Sale",
  pickExpense: "🧾 Expense",
  pickCredit: "📒 Credit",
  choiceExpired: "This choice has expired. Please write the message again.",
  needAmount: "Please add the amount too 🙂\n\nFor example: bread 50 somoni",
  customerNotFound: "This customer was not found in Kassa. Check the name and write again. Not saved.",
  customerAmbiguous: "Kassa has several customers with this name. Please record this on the website. Not saved.",
  noOpenDebts: "This customer has no debt. Not saved.",
  exceedsDebt: (remaining) => `The amount is more than the debt. This customer owes only ${remaining}. Not saved.`,
  amountTooLarge: "The amount is too large. Not saved.",
  saveFailed: "Something went wrong, nothing was saved. Please try again a little later.",
  tooManyMessages: "Too many messages. Wait a minute and write again.",
};

export const MESSAGES_EXTRA: Record<Lang, ExtraMessages> = { tg, ru, en };