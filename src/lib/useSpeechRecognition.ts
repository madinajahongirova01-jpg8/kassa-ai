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

export type SpeechScope = {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

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

export function findRecognition(scope: SpeechScope | undefined): RecognitionConstructor | null {
  return scope?.SpeechRecognition ?? scope?.webkitSpeechRecognition ?? null;
}

function getRecognition() {
  return findRecognition(typeof window === "undefined" ? undefined : (window as Window & SpeechScope));
}

function subscribe() {
  return () => {};
}

export function useSpeechRecognition(lang: string, onText: (text: string) => void, onEnd: () => void) {
  const supported = useSyncExternalStore(subscribe, () => getRecognition() !== null, () => true);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const onTextRef = useRef(onText);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onTextRef.current = onText;
    onEndRef.current = onEnd;
  }, [onText, onEnd]);

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
      setListening(false);
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setListening(false);
      onEndRef.current();
    };

    setError(null);
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {
      setListening(false);
      setError(FAILED);
    }
  }, [lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { supported, listening, error, start, stop };
}
