import { describe, expect, it } from "vitest";
import { authenticate, isWakingStatus, sendWithTimeout, type Fetcher } from "@/lib/authRequest";
import { createT } from "@/lib/i18n/translate";

type Step = number | "hang" | "fail";

function fakeFetch(steps: Record<string, Step[]>) {
  const calls: string[] = [];
  const fetcher: Fetcher = (url, init) => {
    calls.push(url);
    const step = steps[url]?.shift() ?? 500;
    if (step === "fail") return Promise.reject(new TypeError("Failed to fetch"));
    if (step === "hang") {
      return new Promise<Response>((_, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      });
    }
    return Promise.resolve(new Response(null, { status: step }));
  };
  return { fetcher, calls };
}

const login = { email: "a@b.tj", password: "secret123" };
const register = { ...login, businessName: "Дӯкон" };

describe("sendWithTimeout", () => {
  it("gives up after the timeout instead of waiting forever", async () => {
    const { fetcher } = fakeFetch({ "/x": ["hang"] });
    expect(await sendWithTimeout(fetcher, "/x", { method: "GET" }, 20)).toBe(0);
  });

  it("treats a network failure like a timeout", async () => {
    const { fetcher } = fakeFetch({ "/x": ["fail"] });
    expect(await sendWithTimeout(fetcher, "/x", { method: "GET" }, 20)).toBe(0);
  });

  it("returns the status of a real answer", async () => {
    const { fetcher } = fakeFetch({ "/x": [401] });
    expect(await sendWithTimeout(fetcher, "/x", { method: "GET" }, 20)).toBe(401);
  });
});

describe("authenticate", () => {
  it("signs in when the API and session answer", async () => {
    const { fetcher, calls } = fakeFetch({ "/api/auth/login": [200], "/api/auth/me": [200] });
    expect(await authenticate({ mode: "login", body: login, fetcher })).toEqual({ ok: true });
    expect(calls).toEqual(["/api/auth/login", "/api/auth/me"]);
  });

  it("retries once while the server wakes up and tells the user", async () => {
    const { fetcher, calls } = fakeFetch({ "/api/auth/login": ["hang", 200], "/api/auth/me": [200] });
    const notices: string[] = [];
    const outcome = await authenticate({ mode: "login", body: login, fetcher, timeoutMs: 20, onWaking: () => notices.push("waking") });
    expect(outcome).toEqual({ ok: true });
    expect(notices).toEqual(["waking"]);
    expect(calls).toEqual(["/api/auth/login", "/api/auth/login", "/api/auth/me"]);
  });

  it("stops after one retry and shows the waking message", async () => {
    const { fetcher, calls } = fakeFetch({ "/api/auth/login": [503, "hang"] });
    const outcome = await authenticate({ mode: "login", body: login, fetcher, timeoutMs: 20 });
    expect(outcome).toEqual({ ok: false, key: "auth.errors.waking" });
    expect(calls).toHaveLength(2);
  });

  it.each([502, 504])("treats %i as a sleeping server", async (status) => {
    const { fetcher, calls } = fakeFetch({ "/api/auth/login": [status, 200], "/api/auth/me": [200] });
    expect(await authenticate({ mode: "login", body: login, fetcher })).toEqual({ ok: true });
    expect(calls).toHaveLength(3);
  });

  it.each([
    [401, "login", "auth.errors.wrongCredentials"],
    [429, "login", "auth.errors.tooMany"],
    [409, "register", "auth.errors.emailTaken"],
    [400, "register", "auth.errors.registerInvalid"],
    [500, "login", "auth.errors.server"],
  ] as const)("maps %i on %s to a clear message without a retry", async (status, mode, key) => {
    const url = `/api/auth/${mode}`;
    const { fetcher, calls } = fakeFetch({ [url]: [status] });
    expect(await authenticate({ mode, body: mode === "login" ? login : register, fetcher })).toEqual({ ok: false, key });
    expect(calls).toEqual([url]);
  });

  it("does not create a second account when the first registration finished in the background", async () => {
    const { fetcher, calls } = fakeFetch({ "/api/auth/register": ["hang", 409], "/api/auth/login": [200], "/api/auth/me": [200] });
    expect(await authenticate({ mode: "register", body: register, fetcher, timeoutMs: 20 })).toEqual({ ok: true });
    expect(calls).toEqual(["/api/auth/register", "/api/auth/register", "/api/auth/login", "/api/auth/me"]);
  });

  it("still says the email is taken when it belongs to someone else", async () => {
    const { fetcher } = fakeFetch({ "/api/auth/register": [503, 409], "/api/auth/login": [401] });
    expect(await authenticate({ mode: "register", body: register, fetcher })).toEqual({ ok: false, key: "auth.errors.emailTaken" });
  });

  it("reports a lost session and a slow session check separately", async () => {
    const lost = fakeFetch({ "/api/auth/login": [200], "/api/auth/me": [401] });
    expect(await authenticate({ mode: "login", body: login, fetcher: lost.fetcher })).toEqual({ ok: false, key: "auth.errors.sessionLost" });
    const slow = fakeFetch({ "/api/auth/login": [200], "/api/auth/me": ["hang"] });
    expect(await authenticate({ mode: "login", body: login, fetcher: slow.fetcher, sessionTimeoutMs: 20 })).toEqual({
      ok: false,
      key: "auth.errors.waking",
    });
  });
});

describe("waking texts", () => {
  it("recognise only timeouts and gateway errors", () => {
    expect([0, 502, 503, 504].every(isWakingStatus)).toBe(true);
    expect([200, 401, 409, 429, 500].some(isWakingStatus)).toBe(false);
  });

  it("exist in every language", () => {
    expect(createT("tg")("auth.errors.waking")).toBe("Сервер бедор шуда истодааст, 30–60 сония интизор шавед ва боз кӯшиш кунед.");
    expect(createT("ru")("auth.errors.waking")).toBe("Сервер просыпается, подождите 30–60 секунд и попробуйте снова.");
    expect(createT("en")("auth.errors.waking")).toBe("The server is waking up. Wait 30–60 seconds and try again.");
  });
});
