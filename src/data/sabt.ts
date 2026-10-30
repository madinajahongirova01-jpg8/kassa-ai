export type SabtMode = "voice" | "text" | "photo";

export const sabtModes: { id: SabtMode; label: string; tag?: string; disabled?: boolean }[] = [
  { id: "text", label: "Матн" },
  { id: "voice", label: "Овоз", tag: "санҷишӣ" },
  { id: "photo", label: "Акси чек", tag: "Ба наздикӣ", disabled: true },
];

export const sabtDemo = {
  transcript: "Имрӯз 2 халта орд гирифтам 600, такси 30, ба коргар 150 додам. Фурӯш 1800 шуд.",
  seconds: 9,
  date: "24 май",
  time: "14:35",
};

export const waveform = [30, 60, 90, 50, 75, 40, 85, 55, 30, 70, 95, 45, 65, 35, 80, 50, 25, 40, 20, 30, 15, 25];
