import type { NextRequest, NextResponse } from "next/server";

// The API access token lives only in this httpOnly cookie: browser JavaScript can't read it.
export const SESSION_COOKIE = "kassa_session";

// Expire the cookie slightly before the token so the browser never sends an already expired token.
const EXPIRY_MARGIN_SECONDS = 10;

export function readSessionToken(request: NextRequest): string | undefined {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return token ? token : undefined;
}

export function setSessionCookie(response: NextResponse, token: string, expiresInSeconds: number) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresInSeconds - Math.min(EXPIRY_MARGIN_SECONDS, Math.floor(expiresInSeconds / 10)),
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
