import { installMode, isIosDevice, readDismissed, saveDismissed, type InstallMode } from "@/lib/pwa";

type InstallChoice = { outcome: "accepted" | "dismissed" };
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<InstallChoice> };

let deferred: InstallEvent | null = null;
let hiddenThisVisit = false;
const listeners = new Set<() => void>();

function isInstallEvent(event: Event): event is InstallEvent {
  return "prompt" in event && typeof event.prompt === "function" && "userChoice" in event;
}

function notify() {
  listeners.forEach((listener) => listener());
}

function storage() {
  return window.localStorage;
}

function isStandalone() {
  const iosStandalone = "standalone" in navigator && navigator.standalone === true;
  return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

function hide() {
  hiddenThisVisit = true;
  deferred = null;
  saveDismissed(storage);
  notify();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    if (!isInstallEvent(event)) return;
    event.preventDefault();
    deferred = event;
    notify();
  });
  window.addEventListener("appinstalled", hide);
}

export function subscribeInstall(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function currentInstallMode(): InstallMode {
  return installMode({
    standalone: isStandalone(),
    dismissed: hiddenThisVisit || readDismissed(storage),
    ios: isIosDevice(navigator.userAgent, navigator.maxTouchPoints),
    canPrompt: deferred !== null,
  });
}

export function dismissInstall() {
  hide();
}

export async function promptInstall() {
  const event = deferred;
  if (!event) return;
  await event.prompt();
  const choice = await event.userChoice;
  deferred = null;
  if (choice.outcome === "accepted") hide();
  else notify();
}
