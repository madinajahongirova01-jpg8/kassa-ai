export type VoiceReceiptKind = "expense" | "income" | "debt";

export type VoiceReceiptItem = {
  id: string;
  title: string;
  shortTitle: string;
  category: string;
  icon: string;
  kind: VoiceReceiptKind;
  amount: number;
};

export type ProcessingStep = {
  label: string;
  status: "done" | "active" | "pending";
  progress: string;
};

export type VoiceRecord = {
  id: string;
  text: string;
  time: string;
  amount: number;
  ledger: string;
};

export const voiceSession = {
  transcript:
    "Имрӯз 2 халта орд гирифтам 600, такси 30, ба коргар 150 додам. Фурӯш 1800 шуд. Боз Алишер 120 смн қарзашро супорид.",
  duration: "00:08",
  confidence: "99.2%",
  model: "AI Модели 2.4 Фаъол",
  modelShort: "AI 2.4 Фаъол",
  engine: "Модели забонии Kassa Whisper TJ v2",
  time: "Имрӯз, 24 Май • 16:45",
  receiptNumber: "#8492-TJ",
  receiptTime: "Имрӯз, 16:45",
  shop: "Дӯкони №1 (Душанбе)",
  shopShort: "Дӯкони марказӣ",
  barcode: "TJ-8492-2024-KASSA-AI",
};

export const voiceReceiptItems: VoiceReceiptItem[] = [
  { id: "r1", title: "Орд (2 халта, навъи якум)", shortTitle: "Орд (2 халта)", category: "Мавод ва ашё", icon: "shopping_bag", kind: "expense", amount: -600 },
  { id: "r2", title: "Роҳкиро ва боркашонӣ (Такси)", shortTitle: "Такси", category: "Логистика", icon: "local_taxi", kind: "expense", amount: -30 },
  { id: "r3", title: "Маоши коргар (Пешпардохт)", shortTitle: "Маоши коргар", category: "Маош", icon: "badge", kind: "expense", amount: -150 },
  { id: "r4", title: "Фурӯши рӯзона (Савдои нақдӣ)", shortTitle: "Фурӯши рӯз", category: "Даромад", icon: "payments", kind: "income", amount: 1800 },
  { id: "r5", title: "Бозпардохти насия: Алишер Қ.", shortTitle: "Насия: Алишер Қ.", category: "Пардохти қарз", icon: "person_check", kind: "debt", amount: 120 },
];

export const processingSteps: ProcessingStep[] = [
  { label: "Сабти овоз қабул шуд (00:08)", status: "done", progress: "100%" },
  { label: "Овоз ба матн табдил ёфт (Whisper TJ)", status: "done", progress: "100%" },
  { label: "Ҷудокунии категорияҳо ва ҳисоббаробаркунӣ…", status: "active", progress: "85%" },
  { label: "Эҷоди чеки рақамӣ ва сабт дар дафтар", status: "pending", progress: "Интизор" },
];

export const recentVoiceRecords: VoiceRecord[] = [
  { id: "v1", text: "«Дирӯз: Фурӯш 2200, гӯшт 400...»", time: "Дирӯз, 19:10", amount: 1800, ledger: "Дафтар #2803" },
  { id: "v2", text: "«Бор оварданд равған 850 сомонӣ...»", time: "12 Май, 14:20", amount: -850, ledger: "Дафтар #2802" },
];
