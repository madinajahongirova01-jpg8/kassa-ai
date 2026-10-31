import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const ORIGIN = "http://localhost:3000";
const USER = { id: "7f9c2c1e-3b0a-4c39-9a51-0d4f3f7d2a10", email: "owner@example.com", name: null, businessName: "Shop", createdAt: "2026-10-31T10:00:00.000Z" };
const BODY = { currentPassword: "old-password-1", newPassword: "new-password-1" };

function changeRequest(headers: Record<string, string> = {}) {
  return new NextRequest(`${ORIGIN}/api/auth/change-password`, {
    method: "POST",
    headers: { origin: ORIGIN, "sec-fetch-site": "same-origin", "content-type": "application/json", cookie: "kassa_session=old.session.token", ...headers },
    body: JSON.stringify(BODY),
  });
}

function apiAnswers(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sessionCookie(response: Response) {
  return response.headers.get("set-cookie") ?? "";
}

describe("POST /api/auth/change-password", () => {
  beforeEach(() => {
    vi.stubEnv("KASSA_API_URL", "http://localhost:3001");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("forwards the passwords with the old token and replaces the cookie with the new one", async () => {
    const fetchMock = apiAnswers({ changed: true, accessToken: "new.session.token", tokenType: "Bearer", expiresIn: 3600, user: USER });

    const response = await POST(changeRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ changed: true });
    expect(sessionCookie(response)).toContain("kassa_session=new.session.token");
    expect(sessionCookie(response)).toContain("HttpOnly");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3001/auth/change-password");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer old.session.token");
    expect(JSON.parse(String(init?.body))).toEqual(BODY);
  });

  it("never returns the new token to the browser", async () => {
    apiAnswers({ changed: true, accessToken: "new.session.token", tokenType: "Bearer", expiresIn: 3600, user: USER });

    const text = await (await POST(changeRequest())).text();

    expect(text).not.toContain("new.session.token");
  });

  it("still reports success when the API changed the password but sent no token, and ends the old session", async () => {
    apiAnswers({ changed: true });

    const response = await POST(changeRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ changed: true });
    expect(sessionCookie(response)).toMatch(/kassa_session=;.*Max-Age=0/);
  });

  it("passes a wrong current password through as 400 and keeps the cookie", async () => {
    apiAnswers({ message: "Validation failed", details: ["currentPassword is incorrect"] }, 400);

    const response = await POST(changeRequest());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Validation failed", details: ["currentPassword is incorrect"] });
    expect(sessionCookie(response)).toBe("");
  });

  it("clears the cookie when the API rejects the session", async () => {
    apiAnswers({ message: "Missing or invalid access token" }, 401);

    const response = await POST(changeRequest());

    expect(response.status).toBe(401);
    expect(sessionCookie(response)).toMatch(/kassa_session=;.*Max-Age=0/);
  });

  it("rejects a cross-site request without calling the API", async () => {
    const fetchMock = apiAnswers({ changed: true });

    const response = await POST(changeRequest({ origin: "https://evil.example", "sec-fetch-site": "cross-site" }));

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
