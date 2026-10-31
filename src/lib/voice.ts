import type { Locale } from "@/lib/i18n/config";

export type VoiceLanguage = "ru" | "en";

export const VOICE_LANGUAGES: VoiceLanguage[] = ["ru", "en"];

const RECOGNITION_LANG: Record<VoiceLanguage, string> = { ru: "ru-RU", en: "en-US" };

export function canChooseVoiceLanguage(locale: Locale): boolean {
  return locale === "tg";
}

export function recognitionLang(locale: Locale, choice: VoiceLanguage = "ru"): string {
  if (locale === "ru") return RECOGNITION_LANG.ru;
  if (locale === "en") return RECOGNITION_LANG.en;
  return RECOGNITION_LANG[choice];
}
