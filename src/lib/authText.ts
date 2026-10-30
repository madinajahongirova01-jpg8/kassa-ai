import type { MessageKey } from "@/lib/i18n/translate";

export type AuthMode = "login" | "register";

export function authErrorKey(status: number, mode: AuthMode): MessageKey {
  if (status === 401 && mode === "login") return "auth.errors.wrongCredentials";
  if (status === 429) return "auth.errors.tooMany";
  if (status === 409) return "auth.errors.emailTaken";
  if (status === 400) return mode === "register" ? "auth.errors.registerInvalid" : "auth.errors.loginInvalid";
  if (status === 403) return "auth.errors.forbidden";
  return "auth.errors.server";
}
