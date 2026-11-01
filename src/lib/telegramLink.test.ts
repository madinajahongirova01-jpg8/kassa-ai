import { describe, expect, it, vi } from "vitest";
import type { PostResult } from "@/lib/api/client";
import { linkTelegram, normalizeLinkCode, telegramErrorText, unlinkTelegram, validateLinkCode } from "@/lib/telegramLink";

function fakePost(result: PostResult<unknown>) {
  const calls: { url: string; body: unknown }[] = [];
  const send = vi.fn(async (url: string, body: unknown) => {
    calls.push({ url, body });
    return result;
  });
  return { send: send as unknown as <T>(url: string, body: unknown) => Promise<PostResult<T>>, calls };
}

type Delete = <T>(url: string) => Promise<PostResult<T>>;

const LINKED = { linked: true, linkedAt: "2026-11-01T05:00:00.000Z" };

describe("link code format", () => {
  it("reads the code like the bot: any case, spaces and the dash are ignored", () => {
    expect(normalizeLinkCode(" abcd-efgh ")).toBe("ABCDEFGH");
    expect(normalizeLinkCode("AB CD EF GH")).toBe("ABCDEFGH");
    expect(validateLinkCode("abcd-efgh", "en")).toBeUndefined();
  });

  it("explains an empty code and a code in the wrong format", () => {
    expect(validateLinkCode("  ", "en")).toBe("Enter the code from the bot.");
    expect(validateLinkCode("ABCD-EFG", "en")).toMatch(/8 letters and digits/);
    // 0, 1, I and O are never in a code, so a typo is caught before it costs an attempt.
    expect(validateLinkCode("ABCD-EFG0", "en")).toMatch(/8 letters and digits/);
    expect(validateLinkCode("", "tg")).toBe("Рамзро аз бот нависед.");
  });
});

describe("linkTelegram", () => {
  it("sends the normalized code and returns the new status", async () => {
    const { send, calls } = fakePost({ ok: true, data: LINKED });

    expect(await linkTelegram("abcd-efgh", send, "en")).toEqual({ ok: true, status: LINKED });
    expect(calls).toEqual([{ url: "/api/telegram/link", body: { code: "ABCDEFGH" } }]);
  });

  it("does not call the API for a code in the wrong format", async () => {
    const { send, calls } = fakePost({ ok: true, data: LINKED });

    expect(await linkTelegram("abc", send, "en")).toEqual({ ok: false, error: expect.stringMatching(/8 letters/) });
    expect(calls).toEqual([]);
  });

  it("treats an unexpected answer as a server error", async () => {
    const { send } = fakePost({ ok: true, data: { linked: "yes" } });
    expect(await linkTelegram("ABCDEFGH", send, "en")).toEqual({ ok: false, error: telegramErrorText(500, [], "en") });
  });

  it("explains wrong, expired, conflicting and rate-limited codes", async () => {
    const wrong = fakePost({ ok: false, status: 400, details: ["attemptsLeft: 2"] });
    expect(await linkTelegram("ABCDEFGH", wrong.send, "en")).toEqual({
      ok: false,
      error: "The code is wrong or has expired. Send /link to the bot to get a new one. Attempts left: 2.",
    });
    expect(telegramErrorText(400, [], "en")).toBe("The code is wrong or has expired. Send /link to the bot to get a new one.");
    expect(telegramErrorText(409, [], "en")).toMatch(/already linked/);
    expect(telegramErrorText(429, [], "en")).toBe("Too many attempts. Try again in 15 minutes.");
    expect(telegramErrorText(401, [], "en")).toBe("Your session has expired. Sign in again.");
    expect(telegramErrorText(0, [], "en")).toMatch(/No internet connection/);
    expect(telegramErrorText(503, [], "en")).toMatch(/isn't responding/);
  });
});

describe("unlinkTelegram", () => {
  it("calls DELETE on the link route", async () => {
    const send = vi.fn(async () => ({ ok: true as const, data: null }));
    expect(await unlinkTelegram(send as unknown as Delete, "en")).toEqual({ ok: true });
    expect(send).toHaveBeenCalledWith("/api/telegram/link");
  });

  it("explains a failure", async () => {
    const send = vi.fn(async () => ({ ok: false as const, status: 0, details: [] }));
    expect(await unlinkTelegram(send as unknown as Delete, "en")).toEqual({ ok: false, error: telegramErrorText(0, [], "en") });
  });
});
