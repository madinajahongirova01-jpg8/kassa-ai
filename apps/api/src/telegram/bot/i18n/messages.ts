import type { Lang } from "../types/language";
import type { TransactionType } from "../types/transaction";

export const CHOOSE_LANGUAGE =
  "Забонро интихоб кунед 🌐\nВыберите язык\nChoose your language";

export const NEED_START = "Нависед /start\nНапишите /start\nSend /start";

export interface Messages {
  friend: string;
  languageSet: string;
  welcomeNew: (name: string) => string;
  welcomeBack: (name: string) => string;
  notUnderstood: string;
  needCustomer: string;
  types: Record<TransactionType, string>;
  amount: string;
  customer: string;
  description: string;
  askSave: string;
  saved: string;
  cancelled: string;
  alreadyDone: string;
  confirmButton: string;
  cancelButton: string;
  todayTitle: string;
  income: string;
  expense: string;
  profit: string;
  creditGiven: (amount: string) => string;
  debtsTitle: string;
  total: string;
  noDebts: string;
  overdueHeader: string;
  otherHeader: string;
  help: string;
  stopped: string;
}

const tg: Messages = {
  friend: "дӯст",
  languageSet: "Забон интихоб шуд ✅",
  welcomeNew: (name) =>
    `Салом, ${name}! 👋\n\nМан Kassa AI — ёрдамчии ҳисобдории шумо.\n\nҲисоби шумо сохта шуд ✅\n\nФурӯш, хароҷот ва қарзҳои худро ба ман бо матн нависед.`,
  welcomeBack: (name) => `Хуш омадед, ${name}! 👋\n\nҲисоби шумо аллакай ҳаст.`,
  notUnderstood:
    "Нафаҳмидам 😅\n\nБо калимаҳои худатон нависед, ки чӣ кор кардед ва маблағ чанд аст. Дар паём бояд амал (фурӯш, харид ё насия) ва маблағ бошад.",
  needCustomer: "Номи харидорро ҳам нависед 🙂",
  types: {
    sale: "💰 Фурӯш",
    expense: "🧾 Хароҷот",
    credit_sale: "📒 Нася (қарз)",
    debt_payment: "💵 Баргардонидани қарз",
  },
  amount: "Маблағ",
  customer: "Муштарӣ",
  description: "Тавсиф",
  askSave: "Сабт кунам?",
  saved: "✅ Сабт шуд",
  cancelled: "❌ Бекор карда шуд",
  alreadyDone: "Ин амалиёт аллакай ҷавоб дода шудааст.",
  confirmButton: "✅ Тасдиқ",
  cancelButton: "❌ Бекор",
  todayTitle: "📊 Имрӯз",
  income: "💰 Даромад",
  expense: "🧾 Хароҷот",
  profit: "📈 Фоида",
  creditGiven: (amount) => `📒 Нася дода шуд: ${amount} (ин даромад нест)`,
  debtsTitle: "📒 Қарзҳо",
  total: "Ҷамъ",
  noDebts: "Ҳоло касе қарздор нест ✅",
  overdueHeader: "⚠️ Мӯҳлаташон гузаштааст:",
  otherHeader: "Дигар қарзҳо:",
  help:
    "ℹ️ Роҳнамо\n\nБа ман бо матн нависед, ки чӣ кор кардед:\n• 50 сомонӣ нон фурӯхтам\n• харидам 120 сомонӣ орд\n• Ба Ҷамшед насия 100 сомонӣ нон додам\n• Ҷамшед 40 сомонӣ баргардонд\n\nБот квитансия нишон медиҳад. Тасдиқ кунед ё бекор кунед.\n\n/today — имрӯз\n/debts — қарзҳо\n/language — забон\n/link — рамзи пайвастшавӣ\n/stop — қатъ кардан",
  stopped:
    "Бот қатъ шуд 🛑\nМаълумоти шумо нигоҳ дошта мешавад. Барои аз нав оғоз кардан /start нависед.",
};

const ru: Messages = {
  friend: "друг",
  languageSet: "Язык выбран ✅",
  welcomeNew: (name) =>
    `Привет, ${name}! 👋\n\nЯ Kassa AI — ваш помощник по учёту.\n\nВаш аккаунт создан ✅\n\nПишите мне текстом о продажах, расходах и долгах.`,
  welcomeBack: (name) => `С возвращением, ${name}! 👋\n\nВаш аккаунт уже есть.`,
  notUnderstood:
    "Не понял 😅\n\nНапишите своими словами, что вы сделали и на какую сумму. В сообщении должно быть действие (продажа, покупка или в долг) и сумма.",
  needCustomer: "Укажите ещё имя покупателя 🙂",
  types: {
    sale: "💰 Продажа",
    expense: "🧾 Расход",
    credit_sale: "📒 В долг (нася)",
    debt_payment: "💵 Возврат долга",
  },
  amount: "Сумма",
  customer: "Покупатель",
  description: "Описание",
  askSave: "Сохранить?",
  saved: "✅ Сохранено",
  cancelled: "❌ Отменено",
  alreadyDone: "Эта операция уже обработана.",
  confirmButton: "✅ Подтвердить",
  cancelButton: "❌ Отмена",
  todayTitle: "📊 Сегодня",
  income: "💰 Доход",
  expense: "🧾 Расход",
  profit: "📈 Прибыль",
  creditGiven: (amount) => `📒 Выдано в долг: ${amount} (это не доход)`,
  debtsTitle: "📒 Долги",
  total: "Итого",
  noDebts: "Пока никто не должен ✅",
  overdueHeader: "⚠️ Срок истёк:",
  otherHeader: "Остальные долги:",
  help:
    "ℹ️ Помощь\n\nПишите мне текстом, что вы сделали:\n• Продал хлеб за 50 сомони\n• Купил муку 120 сомони\n• Продал Алишеру в долг на 100\n• Алишер вернул 40 сомони\n\nБот покажет квитанцию. Подтвердите или отмените.\n\n/today — сегодня\n/debts — долги\n/language — язык\n/link — код привязки\n/stop — остановить",
  stopped:
    "Бот остановлен 🛑\nВаши данные сохранены. Чтобы начать заново, напишите /start.",
};

const en: Messages = {
  friend: "friend",
  languageSet: "Language selected ✅",
  welcomeNew: (name) =>
    `Hello, ${name}! 👋\n\nI am Kassa AI, your bookkeeping assistant.\n\nYour account has been created ✅\n\nWrite to me about your sales, expenses and debts.`,
  welcomeBack: (name) => `Welcome back, ${name}! 👋\n\nYour account already exists.`,
  notUnderstood:
    "I didn't understand 😅\n\nWrite in your own words what you did and the amount. The message should include the action (sale, purchase or credit) and the amount.",
  needCustomer: "Please add the customer's name too 🙂",
  types: {
    sale: "💰 Sale",
    expense: "🧾 Expense",
    credit_sale: "📒 Credit sale (debt)",
    debt_payment: "💵 Debt payment",
  },
  amount: "Amount",
  customer: "Customer",
  description: "Description",
  askSave: "Save it?",
  saved: "✅ Saved",
  cancelled: "❌ Cancelled",
  alreadyDone: "This entry was already handled.",
  confirmButton: "✅ Confirm",
  cancelButton: "❌ Cancel",
  todayTitle: "📊 Today",
  income: "💰 Income",
  expense: "🧾 Expenses",
  profit: "📈 Profit",
  creditGiven: (amount) => `📒 Given on credit: ${amount} (not income)`,
  debtsTitle: "📒 Debts",
  total: "Total",
  noDebts: "Nobody owes you right now ✅",
  overdueHeader: "⚠️ Past due date:",
  otherHeader: "Other debts:",
  help:
    "ℹ️ Help\n\nWrite to me in text what you did:\n• Sold bread for 50 somoni\n• Bought flour 120 somoni\n• Sold bread to Ali on credit 100 somoni\n• Ali returned 40 somoni\n\nThe bot shows a receipt. Confirm or cancel it.\n\n/today — today\n/debts — debts\n/language — language\n/link — linking code\n/stop — stop the bot",
  stopped:
    "Bot stopped 🛑\nYour data is kept. Send /start to begin again.",
};

export const MESSAGES: Record<Lang, Messages> = { tg, ru, en };