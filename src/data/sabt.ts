import type { MessageKey } from "@/lib/i18n/translate";

export type SabtMode = "voice" | "text" | "photo";

export const sabtModes: { id: SabtMode; labelKey: MessageKey; tagKey?: MessageKey; disabled?: boolean }[] = [
  { id: "text", labelKey: "sabt.modes.text" },
  { id: "voice", labelKey: "sabt.modes.voice", tagKey: "sabt.modes.voiceTag" },
  { id: "photo", labelKey: "sabt.modes.photo", tagKey: "sabt.modes.photoTag", disabled: true },
];

export const sabtDemo = {
  transcript: "Имрӯз 2 халта орд гирифтам 600, такси 30, ба коргар 150 додам. Фурӯш 1800 шуд.",
  seconds: 9,
  date: "2024-05-24",
  time: "14:35",
};

export const waveform = [30, 60, 90, 50, 75, 40, 85, 55, 30, 70, 95, 45, 65, 35, 80, 50, 25, 40, 20, 30, 15, 25];
