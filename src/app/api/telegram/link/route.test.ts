import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, POST } from "./route";

const ORIGIN = "http://localhost:3000";
const SAME_ORIGIN = { origin: ORIGIN, "sec-fetch-site": "same-origin", cookie: "kassa_session=owner.session.token" };

function linkRequest(method: "POST" | "DELETE", headers: Record<string, string> = {}, body?: unknown) {
  return new NextRequest(`${ORIGIN}/api/telegram/link`, {
    method,
    headers: { ...SAME_ORIGIN, ...(body === undefined ? {} : { "content-type": "application/json" }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function apiAnswers(response: () => Response) {
  const fetchMock = vi.fn<typeof fetch>(async () => response());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("/api/telegram/link", () => {
  beforeEach(() => {
    vi.stubEnv("KASSA_API_URL", "http://localhost:3001");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("forwards only the code with the session token", async () => {
    const fetchMock = apiAnswers(() => Response.json({ linked: true, linkedAt: "2026-11-01T05:00:00.000Z" }));

    const response = await POST(linkRequest("POST", {}, { code: "ABCDEFGH", userId: "someone-else" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ linked: true, linkedAt: "2026-11-01T05:00:00.000Z" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3001/telegram/link");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer owner.session.token");
    expect(JSON.parse(String(init?.body))).toEqual({ code: "ABCDEFGH" });
  });

  it("passes on a wrong code with the attempts left", async () => {
    apiAnswers(() => Response.json({ message: "Invalid or expired code", details: ["attemptsLeft: 3"] }, { status: 400 }));

    const response = await POST(linkRequest("POST", {}, { code: "ABCDEFGH" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Invalid or expired code", details: ["attemptsLeft: 3"] });
  });

  it("unlinks with the session token and answers 204 without a body", async () => {
    const fetchMock = apiAnswers(() => new Response(null, { status: 204 }));

    const response = await DELETE(linkRequest("DELETE"));

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3001/telegram/link");
    expect(init?.method).toBe("DELETE");
    expect(init?.body).toBeUndefined();
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer owner.session.token");
  });

  it.each(["POST", "DELETE"] as const)("rejects a cross-site %s before calling the API", async (method) => {
    const fetchMock = apiAnswers(() => Response.json({}));

    const handler = method === "POST" ? POST : DELETE;
    const response = await handler(linkRequest(method, { origin: "https://evil.example", "sec-fetch-site": "cross-site" }, method === "POST" ? { code: "ABCDEFGH" } : undefined));

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks to sign in without a session and clears a rejected one", async () => {
    const fetchMock = apiAnswers(() => Response.json({ message: "Unauthorized" }, { status: 401 }));

    const noSession = await DELETE(linkRequest("DELETE", { cookie: "" }));
    expect(noSession.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();

    const rejected = await DELETE(linkRequest("DELETE"));
    expect(rejected.status).toBe(401);
    expect(rejected.headers.get("set-cookie")).toContain("kassa_session=;");
  });
});
