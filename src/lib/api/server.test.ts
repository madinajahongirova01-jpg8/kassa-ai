import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/server";

describe("apiRequest", () => {
  beforeEach(() => {
    vi.stubEnv("KASSA_API_URL", "https://api.example");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("answers 504 when the API does not reply in time", async () => {
    vi.stubGlobal(
      "fetch",
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) => init.signal?.addEventListener("abort", () => reject(init.signal?.reason))),
    );
    expect(await apiRequest("/auth/login", { method: "POST", body: {}, timeoutMs: 20 })).toEqual({
      ok: false,
      error: { status: 504, message: "API timed out" },
    });
  });

  it("answers 503 when the API cannot be reached", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("fetch failed")));
    expect(await apiRequest("/health")).toEqual({ ok: false, error: { status: 503, message: "API is unavailable" } });
  });

  it("hides the hosting page of a sleeping API behind 503", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response("<html>Service waking up</html>", { status: 502 })));
    expect(await apiRequest("/health")).toEqual({ ok: false, error: { status: 503, message: "API is unavailable" } });
  });

  it("never passes internal error details to the browser", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(Response.json({ message: "PrismaClientKnownRequestError at db:5432" }, { status: 500 })));
    expect(await apiRequest("/auth/login", { method: "POST", body: {} })).toEqual({
      ok: false,
      error: { status: 500, message: "Internal server error" },
    });
  });

  it("keeps the API message for client errors", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(Response.json({ message: "Invalid email or password" }, { status: 401 })));
    expect(await apiRequest("/auth/login", { method: "POST", body: {} })).toEqual({
      ok: false,
      error: { status: 401, message: "Invalid email or password", details: undefined },
    });
  });
});
