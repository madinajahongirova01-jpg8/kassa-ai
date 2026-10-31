import { authErrorKey, type AuthMode } from "@/lib/authText";
import type { MessageKey } from "@/lib/i18n/translate";

export const AUTH_TIMEOUT_MS = 55_000;
export const SESSION_TIMEOUT_MS = 15_000;

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

export type AuthBody = { email: string; password: string; businessName?: string; name?: string };

export type AuthOutcome = { ok: true } | { ok: false; key: MessageKey };

type AuthOptions = {
  mode: AuthMode;
  body: AuthBody;
  fetcher?: Fetcher;
  timeoutMs?: number;
  sessionTimeoutMs?: number;
  onWaking?: () => void;
};

const TIMED_OUT = 0;

export function isWakingStatus(status: number) {
  return status === TIMED_OUT || status === 502 || status === 503 || status === 504;
}

export async function sendWithTimeout(fetcher: Fetcher, url: string, init: RequestInit, timeoutMs: number): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, { ...init, cache: "no-store", signal: controller.signal });
    return response.status;
  } catch {
    return TIMED_OUT;
  } finally {
    clearTimeout(timer);
  }
}

function isSuccess(status: number) {
  return status >= 200 && status < 300;
}

export async function authenticate({
  mode,
  body,
  fetcher = fetch,
  timeoutMs = AUTH_TIMEOUT_MS,
  sessionTimeoutMs = SESSION_TIMEOUT_MS,
  onWaking,
}: AuthOptions): Promise<AuthOutcome> {
  const post = (target: AuthMode, payload: AuthBody) =>
    sendWithTimeout(
      fetcher,
      `/api/auth/${target}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
      timeoutMs,
    );

  let status = await post(mode, body);
  if (isWakingStatus(status)) {
    onWaking?.();
    status = await post(mode, body);
    if (mode === "register" && status === 409) {
      const login = await post("login", { email: body.email, password: body.password });
      status = isSuccess(login) ? login : 409;
    }
  }

  if (!isSuccess(status)) return { ok: false, key: isWakingStatus(status) ? "auth.errors.waking" : authErrorKey(status, mode) };

  const session = await sendWithTimeout(fetcher, "/api/auth/me", { method: "GET" }, sessionTimeoutMs);
  if (isSuccess(session)) return { ok: true };
  return { ok: false, key: isWakingStatus(session) ? "auth.errors.waking" : "auth.errors.sessionLost" };
}

export function wakeApi(fetcher: Fetcher = fetch) {
  return sendWithTimeout(fetcher, "/api/health", { method: "GET" }, AUTH_TIMEOUT_MS);
}
