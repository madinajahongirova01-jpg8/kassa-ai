import { LOCALES } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";

export const PWA_NAME = "Kassa AI";
export const PWA_START_URL = "/app";
export const PWA_THEME_COLOR = "#f6f8fd";
export const PWA_BACKGROUND_COLOR = "#f6f8fd";
export const PWA_ICONS = {
  small: "/icons/icon-192.png",
  large: "/icons/icon-512.png",
  maskable: "/icons/icon-maskable-512.png",
  apple: "/icons/apple-touch-icon.png",
};
export const INSTALL_DISMISSED_KEY = "kassa_install_dismissed";

export type InstallMode = "prompt" | "ios" | null;

export type InstallState = {
  standalone: boolean;
  dismissed: boolean;
  ios: boolean;
  canPrompt: boolean;
};

export function installMode({ standalone, dismissed, ios, canPrompt }: InstallState): InstallMode {
  if (standalone || dismissed) return null;
  if (canPrompt) return "prompt";
  return ios ? "ios" : null;
}

export function isIosDevice(userAgent: string, maxTouchPoints: number) {
  return /iPhone|iPad|iPod/.test(userAgent) || (userAgent.includes("Macintosh") && maxTouchPoints > 1);
}

export function readDismissed(getStorage: () => Storage) {
  try {
    return getStorage().getItem(INSTALL_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveDismissed(getStorage: () => Storage) {
  try {
    getStorage().setItem(INSTALL_DISMISSED_KEY, "1");
  } catch {
    return;
  }
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function offlinePageHtml() {
  const sections = LOCALES.map((locale) => {
    const t = createT(locale);
    return `<section lang="${locale}"><h1>${escapeHtml(t("pwa.offlineTitle"))}</h1><p>${escapeHtml(t("pwa.offlineText"))}</p><a href="${PWA_START_URL}">${escapeHtml(t("pwa.retry"))}</a></section>`;
  }).join("");
  return `<!DOCTYPE html>
<html lang="tg">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="${PWA_THEME_COLOR}">
<title>${escapeHtml(createT("tg")("pwa.offlineTitle"))} — ${PWA_NAME}</title>
<style>
body{margin:0;min-height:100vh;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1b2340;background-color:#f6f8fd;background-image:linear-gradient(#e1e7f6 1px,transparent 1px),linear-gradient(90deg,#e1e7f6 1px,transparent 1px);background-size:22px 22px}
main{max-width:420px;margin:0 auto;padding:32px 18px;display:flex;flex-direction:column;gap:16px}
img{width:64px;height:64px;border:1.5px solid #1b2340;border-radius:14px;background:#fff}
section{background:#fff;border:1.5px solid #1b2340;box-shadow:4px 4px 0 #1b2340;padding:16px 18px}
h1{margin:0 0 6px;font-size:22px}
p{margin:0 0 12px;color:#5b6480;font-size:15px;line-height:1.4}
a{display:inline-block;padding:9px 14px;border:1.5px solid #1b2340;border-radius:10px;background:#ffe45c;color:#1b2340;font-weight:700;text-decoration:none}
</style>
</head>
<body><main><img src="${PWA_ICONS.small}" alt="${PWA_NAME}">${sections}</main></body>
</html>`;
}
