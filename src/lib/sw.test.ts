import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const ORIGIN = "https://kassa.example";
const source = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");

type FakeRequest = { url: string; method: string; mode: string };
type FakeResponse = { ok: boolean; type: string; body: string; clone: () => FakeResponse };
type FetchEvent = { request: FakeRequest; respondWith: (response: Promise<FakeResponse>) => void };
type Handler = (event: FetchEvent) => void;

function response(body: string): FakeResponse {
  const result: FakeResponse = { ok: true, type: "basic", body, clone: () => result };
  return result;
}

function loadWorker({ online = true } = {}) {
  const handlers = new Map<string, Handler>();
  const stored: string[] = [];
  const offlinePage = response("offline page");
  const cache = {
    put: async (request: FakeRequest) => void stored.push(request.url),
    keys: async () => [],
    delete: async () => true,
    addAll: async () => undefined,
  };
  runInNewContext(source, {
    self: { location: { origin: ORIGIN }, addEventListener: (type: string, handler: Handler) => handlers.set(type, handler) },
    caches: {
      open: async () => cache,
      match: async (request: FakeRequest | string) => (request === "/offline.html" ? offlinePage : undefined),
      keys: async () => [],
      delete: async () => true,
    },
    fetch: async (request: FakeRequest) => {
      if (!online) throw new TypeError("Failed to fetch");
      return response(`network ${request.url}`);
    },
    URL,
    Promise,
  });

  async function send(path: string, { method = "GET", mode = "no-cors" } = {}) {
    let answer: Promise<FakeResponse> | undefined;
    const fetchHandler = handlers.get("fetch");
    if (!fetchHandler) throw new Error("no fetch handler");
    fetchHandler({ request: { url: new URL(path, ORIGIN).href, method, mode }, respondWith: (value) => (answer = value) });
    return answer ? (await answer).body : null;
  }

  return { send, stored };
}

describe("service worker", () => {
  it("never touches API requests", async () => {
    const worker = loadWorker();
    expect(await worker.send("/api/cash-entries")).toBeNull();
    expect(await worker.send("/api/auth/login", { method: "POST", mode: "cors" })).toBeNull();
    expect(await worker.send("/api/auth/me", { mode: "navigate" })).toBeNull();
    expect(worker.stored).toEqual([]);
  });

  it("loads app pages from the network and never stores them", async () => {
    const worker = loadWorker();
    expect(await worker.send("/app/debts", { mode: "navigate" })).toBe(`network ${ORIGIN}/app/debts`);
    expect(await worker.send("/app/debts?_rsc=1", { mode: "cors" })).toBeNull();
    expect(worker.stored).toEqual([]);
  });

  it("shows the offline page when a page cannot load", async () => {
    const worker = loadWorker({ online: false });
    expect(await worker.send("/app", { mode: "navigate" })).toBe("offline page");
    expect(worker.stored).toEqual([]);
  });

  it("caches only static files", async () => {
    const worker = loadWorker();
    await worker.send("/_next/static/chunks/main.js");
    await worker.send("/_next/static/media/font.woff2");
    await worker.send("/icons/icon-192.png");
    await worker.send("/manifest.webmanifest");
    await worker.send("https://fonts.example/font.woff2");
    expect(worker.stored).toEqual([
      `${ORIGIN}/_next/static/chunks/main.js`,
      `${ORIGIN}/_next/static/media/font.woff2`,
      `${ORIGIN}/icons/icon-192.png`,
    ]);
  });
});
