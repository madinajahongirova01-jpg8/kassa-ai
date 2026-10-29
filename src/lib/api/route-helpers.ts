import { NextResponse, type NextRequest } from "next/server";
import { apiRequest, nearestForwardedIp, type ApiError } from "@/lib/api/server";
import { clearSessionCookie, readSessionToken, setSessionCookie } from "@/lib/session";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  businessName: string | null;
};

type AuthResult = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: SessionUser;
};

const NO_STORE = { "Cache-Control": "no-store" };

export function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function errorResponse({ status, message, details }: ApiError) {
  return jsonResponse(details ? { message, details } : { message }, status);
}

// State-changing requests must come from our own pages. Browsers always send Origin on POST,
// so a missing or foreign Origin (or a cross-site Sec-Fetch-Site) is rejected.
export function rejectCrossOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (origin !== request.nextUrl.origin || (fetchSite !== null && fetchSite !== "same-origin")) {
    return errorResponse({ status: 403, message: "Cross-origin request rejected" });
  }
  return null;
}

export async function readJsonObject(request: NextRequest): Promise<Record<string, unknown> | null> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
  const body: unknown = await request.json().catch(() => null);
  return typeof body === "object" && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
}

export function toSessionUser(user: SessionUser | undefined): SessionUser | null {
  if (typeof user?.id !== "string" || typeof user.email !== "string") return null;
  return {
    id: user.id,
    email: user.email,
    name: typeof user.name === "string" ? user.name : null,
    businessName: typeof user.businessName === "string" ? user.businessName : null,
  };
}

export function clientIp(request: NextRequest): string | undefined {
  return nearestForwardedIp(request.headers.get("x-forwarded-for"));
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids are checked before they become part of an API path, so a crafted id can't reach another endpoint. */
export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

// Data changes made by the signed-in user: same-origin check, only the listed body fields are passed on,
// and the session token goes to the API as a Bearer header. The API checks ownership and amounts.
export async function forwardMutation(request: NextRequest, path: string, fields: string[]) {
  const rejected = rejectCrossOrigin(request);
  if (rejected) return rejected;

  const token = readSessionToken(request);
  if (!token) return errorResponse({ status: 401, message: "Not signed in" });

  const body = await readJsonObject(request);
  if (body === null) return errorResponse({ status: 400, message: "Expected a JSON object" });

  const payload = Object.fromEntries(fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
  const result = await apiRequest<unknown>(path, { method: "POST", body: payload, token, clientIp: clientIp(request) });
  if (!result.ok) {
    const response = errorResponse(result.error);
    if (result.error.status === 401) clearSessionCookie(response);
    return response;
  }
  return jsonResponse(result.data, result.status);
}

// Login and registration share one flow: call the API, keep the token in the httpOnly cookie
// and return only the public user to the browser.
export async function startSession(request: NextRequest, path: "/auth/login" | "/auth/register", fields: string[]) {
  const rejected = rejectCrossOrigin(request);
  if (rejected) return rejected;

  const body = await readJsonObject(request);
  if (body === null) return errorResponse({ status: 400, message: "Expected a JSON object" });

  const payload = Object.fromEntries(fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
  const result = await apiRequest<Partial<AuthResult> | null>(path, { method: "POST", body: payload, clientIp: clientIp(request) });
  if (!result.ok) return errorResponse(result.error);

  const accessToken = result.data?.accessToken;
  const expiresIn = result.data?.expiresIn;
  const user = toSessionUser(result.data?.user);
  if (typeof accessToken !== "string" || typeof expiresIn !== "number" || !Number.isInteger(expiresIn) || expiresIn <= 0 || user === null) {
    return errorResponse({ status: 502, message: "Unexpected API response" });
  }

  const response = jsonResponse({ user }, result.status);
  setSessionCookie(response, accessToken, expiresIn);
  return response;
}
