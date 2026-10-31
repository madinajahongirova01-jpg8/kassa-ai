import type { NextRequest } from "next/server";
import { clientIp, errorResponse, forwardMutation, jsonResponse, toSessionUser, type SessionUser } from "@/lib/api/route-helpers";
import { apiRequest } from "@/lib/api/server";
import { clearSessionCookie, readSessionToken } from "@/lib/session";

// The real session check: the API verifies the token. An expired or rejected token clears the cookie.
export async function GET(request: NextRequest) {
  const token = readSessionToken(request);
  if (!token) return errorResponse({ status: 401, message: "Not signed in" });

  const result = await apiRequest<{ user?: SessionUser } | null>("/auth/me", { token, clientIp: clientIp(request) });
  if (!result.ok) {
    const response = errorResponse(result.error);
    if (result.error.status === 401) clearSessionCookie(response);
    return response;
  }

  const user = toSessionUser(result.data?.user);
  if (user === null) return errorResponse({ status: 502, message: "Unexpected API response" });
  return jsonResponse({ user });
}

export async function PATCH(request: NextRequest) {
  return forwardMutation(request, "/auth/me", ["businessName", "name"], "PATCH");
}
