// Server-side client for the NestJS API. Import it only from Route Handlers and proxy code:
// it reads the server-only KASSA_API_URL and forwards the session token as a Bearer header.

import { isIP } from "node:net";

const REQUEST_TIMEOUT_MS = 10_000;

export type ApiError = {
  status: number;
  message: string;
  details?: string[];
};

export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; error: ApiError };

type ApiRequest = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  token?: string;
  clientIp?: string;
};

export function nearestForwardedIp(forwardedFor: string | null): string | undefined {
  const nearest = forwardedFor?.split(",").at(-1)?.trim();
  return nearest && isIP(nearest) !== 0 ? nearest : undefined;
}

function apiBaseUrl(): string | null {
  const raw = process.env.KASSA_API_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin + url.pathname.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function readError(status: number, body: unknown): ApiError {
  // 5xx details are never passed on to the browser.
  if (status >= 500) return { status, message: "Internal server error" };
  if (typeof body === "object" && body !== null) {
    const { message, details } = body as { message?: unknown; details?: unknown };
    return {
      status,
      message: typeof message === "string" ? message : "Request failed",
      details: Array.isArray(details) ? details.filter((d): d is string => typeof d === "string") : undefined,
    };
  }
  return { status, message: "Request failed" };
}

export async function apiRequest<T>(path: string, { method = "GET", body, token, clientIp }: ApiRequest = {}): Promise<ApiResult<T>> {
  const baseUrl = apiBaseUrl();
  if (baseUrl === null) {
    console.error("KASSA_API_URL is missing or is not an http(s) URL");
    return { ok: false, error: { status: 500, message: "API is not configured" } };
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  if (clientIp) headers["X-Forwarded-For"] = clientIp;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, error: { status: 503, message: "API is unavailable" } };
  }

  const data: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) return { ok: false, error: readError(response.status, data) };
  return { ok: true, status: response.status, data: data as T };
}
