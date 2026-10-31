import { describe, expect, it } from "vitest";
import { createT } from "@/lib/i18n/translate";
import { findRecognition, speechErrorKey, type SpeechScope } from "@/lib/useSpeechRecognition";
import { canChooseVoiceLanguage, recognitionLang, VOICE_LANGUAGES } from "@/lib/voice";

class FakeRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  onresult = null;
  onerror = null;
  onend = null;
  start() {}
  stop() {}
  abort() {}
}

describe("recognition language", () => {
  it("follows the Russian and English interface", () => {
    expect(recognitionLang("ru")).toBe("ru-RU");
    expect(recognitionLang("ru", "en")).toBe("ru-RU");
    expect(recognitionLang("en")).toBe("en-US");
    expect(recognitionLang("en", "ru")).toBe("en-US");
  });

  it("lets the Tajik interface choose Russian or English, Russian by default, never tg-TJ", () => {
    expect(canChooseVoiceLanguage("tg")).toBe(true);
    expect(canChooseVoiceLanguage("ru")).toBe(false);
    expect(canChooseVoiceLanguage("en")).toBe(false);
    expect(recognitionLang("tg")).toBe("ru-RU");
    expect(recognitionLang("tg", "en")).toBe("en-US");
    expect(VOICE_LANGUAGES.map((id) => recognitionLang("tg", id))).not.toContain("tg-TJ");
  });

  it("names the choice and promises Tajik only as coming soon", () => {
    const t = createT("tg");
    expect([t("sabt.voice.languages.ru"), t("sabt.voice.languages.en")]).toEqual(["Русӣ", "English"]);
    expect(t("sabt.voice.tajikSoon")).toBe("Овоз ба тоҷикӣ — ба наздикӣ. Ҳоло ба русӣ ё англисӣ гап занед.");
    expect(t("today.newEntry.voiceSoon")).toBe("Овоз — бо русӣ ва англисӣ; тоҷикӣ — ба наздикӣ");
  });
});

describe("browser support", () => {
  it("finds the standard or the webkit recognition", () => {
    expect(findRecognition({ SpeechRecognition: FakeRecognition })).toBe(FakeRecognition);
    expect(findRecognition({ webkitSpeechRecognition: FakeRecognition })).toBe(FakeRecognition);
  });

  it("reports no support in browsers without speech recognition", () => {
    const firefox: SpeechScope = {};
    expect(findRecognition(firefox)).toBeNull();
    expect(findRecognition(undefined)).toBeNull();
    expect(createT("ru")("sabt.voice.unsupported")).toBe("Этот браузер не распознаёт голос, поэтому «Голос» выключен. Напишите текст или откройте Chrome.");
  });
});

describe("microphone errors", () => {
  it("explain a missing permission, silence and no network in every language", () => {
    expect(createT("tg")(speechErrorKey("not-allowed"))).toBe("Иҷозати микрофон дода нашуд. Дар танзимоти браузер микрофонро иҷозат диҳед.");
    expect(createT("tg")(speechErrorKey("no-speech"))).toBe("Овоз шунида нашуд. Наздиктар ба микрофон боз гап занед.");
    expect(createT("en")(speechErrorKey("network"))).toBe("Voice recognition needs an internet connection. Check your connection.");
    expect(createT("ru")(speechErrorKey("audio-capture"))).not.toBe(createT("ru")("sabt.speech.failed"));
  });

  it("no longer blame Tajik when a language is not supported", () => {
    expect(createT("tg")(speechErrorKey("language-not-supported"))).not.toMatch(/тоҷикӣ/);
    expect(createT("en")(speechErrorKey("language-not-supported"))).not.toMatch(/Tajik/);
  });
});
