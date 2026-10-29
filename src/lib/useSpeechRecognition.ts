"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

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

const errorMessages: Record<string, string> = {
  "not-allowed": "Иҷозати микрофон дода нашуд. Дар танзимоти браузер микрофонро иҷозат диҳед.",
  "service-not-allowed": "Браузер шинохтани овозро манъ кард. Матнро дастӣ нависед.",
  "audio-capture": "Микрофон ёфт нашуд. Онро пайваст карда, боз кӯшиш кунед.",
  network: "Барои шинохтани овоз интернет лозим аст. Пайвастро санҷед.",
  "language-not-supported": "Ин браузер забони тоҷикиро барои овоз дастгирӣ намекунад. Матнро дастӣ нависед.",
  "language-unavailable": "Ин браузер забони тоҷикиро барои овоз дастгирӣ намекунад. Матнро дастӣ нависед.",
  "no-speech": "Овоз шунида нашуд. Наздиктар ба микрофон боз гап занед.",
};

const fallbackError = "Шинохтани овоз қатъ шуд. Боз кӯшиш кунед ё матнро дастӣ нависед.";

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
      setError(errorMessages[event.error] ?? fallbackError);
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
      setError(fallbackError);
    }
  }, [lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { supported, listening, error, start, stop };
}
