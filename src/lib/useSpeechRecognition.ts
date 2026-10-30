"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MessageKey } from "@/lib/i18n/translate";

type RecognitionResultEvent = Event & {
  readonly results: SpeechRecognitionResultList;
};

type RecognitionErrorEvent = Event & {
  readonly error: string;
};

type BrowserRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type RecognitionConstructor = new () => BrowserRecognition;

type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

// The hook reports the browser's error code; the screen turns it into text in the chosen language.
const errorKeys: Record<string, MessageKey> = {
  "not-allowed": "sabt.speech.notAllowed",
  "service-not-allowed": "sabt.speech.serviceNotAllowed",
  "audio-capture": "sabt.speech.audioCapture",
  network: "sabt.speech.network",
  "language-not-supported": "sabt.speech.languageNotSupported",
  "language-unavailable": "sabt.speech.languageNotSupported",
  "no-speech": "sabt.speech.noSpeech",
};

const FAILED = "failed";

export function speechErrorKey(code: string): MessageKey {
  return errorKeys[code] ?? "sabt.speech.failed";
}

function getRecognition() {
  const scope = window as SpeechWindow;
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

function subscribe() {
  return () => {};
}

export function useSpeechRecognition(lang: string, onText: (text: string) => void) {
  const supported = useSyncExternalStore(subscribe, () => getRecognition() !== null, () => true);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const start = useCallback(() => {
    const Recognition = getRecognition();
    if (!Recognition) return;
    recognitionRef.current?.abort();

    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const parts: string[] = [];
      for (let index = 0; index < event.results.length; index += 1) {
        parts.push(event.results[index][0].transcript.trim());
      }
      onTextRef.current(parts.filter(Boolean).join(" "));
    };
    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      setError(event.error);
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setListening(false);
    };

    setError(null);
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {
      setError(FAILED);
    }
  }, [lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { supported, listening, error, start, stop };
}
