import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, resolveLocale } from "@/lib/i18n/config";
import { SESSION_COOKIE } from "@/lib/session";

function isAppPath(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic check only: it sees whether a session cookie exists, not whether the token is valid.
  // The token itself is verified by the NestJS API on every data request (and by /api/auth/me).
  if (isAppPath(pathname) && !request.cookies.get(SESSION_COOKIE)?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Pages live under an internal [lang] segment; the browser URL stays the same in every language.
  const url = request.nextUrl.clone();
  url.pathname = `/${resolveLocale(request.cookies.get(LOCALE_COOKIE)?.value)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Everything except API routes, Next.js internals and files with an extension (logo.png, favicon.ico).
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
