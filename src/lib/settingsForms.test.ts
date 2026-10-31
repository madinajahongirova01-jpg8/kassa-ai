import { describe, expect, it, vi } from "vitest";
import type { PostResult } from "@/lib/api/client";
import { changePassword, saveProfile, toProfilePayload, validatePassword, validateProfile, type Send } from "@/lib/settingsForms";

function fakeSend(result: PostResult<unknown>) {
  const calls: { url: string; body: unknown }[] = [];
  const send = vi.fn(async (url: string, body: unknown) => {
    calls.push({ url, body });
    return result;
  }) as unknown as Send;
  return { send, calls };
}

const strong = { current: "old-password", next: "new-password-1", repeat: "new-password-1" };

describe("validateProfile", () => {
  it("requires the business name and limits both fields", () => {
    expect(validateProfile({ businessName: "Дӯкони Азиз", name: "" })).toEqual({});
    expect(validateProfile({ businessName: "  ", name: "" })).toEqual({ businessName: "Номи тиҷоратро нависед." });
    expect(validateProfile({ businessName: "х".repeat(101), name: "х".repeat(101) })).toEqual({
      businessName: "То 100 ҳарф нависед.",
      name: "То 100 ҳарф нависед.",
    });
  });

  it("trims the fields and sends an empty name as null", () => {
    expect(toProfilePayload({ businessName: " Дӯкон ", name: "  " })).toEqual({ businessName: "Дӯкон", name: null });
  });
});

describe("validatePassword", () => {
  it("accepts a strong new password that is repeated", () => {
    expect(validatePassword(strong)).toEqual({});
  });

  it("explains a missing current password, a short one and a different repeat", () => {
    expect(validatePassword({ current: "", next: "short", repeat: "short" })).toEqual({
      current: "Пароли ҳозираро нависед.",
      next: "Пароли нав бояд камаш 8 аломат бошад.",
    });
    expect(validatePassword({ ...strong, repeat: "new-password-2" })).toEqual({ repeat: "Пароли нав ва такрори он якхела нестанд." });
    expect(validatePassword({ current: "same-password", next: "same-password", repeat: "same-password" }, "en")).toEqual({
      next: "The new password must differ from the current one.",
    });
  });
});

describe("saveProfile", () => {
  it("patches the profile through the Next proxy", async () => {
    const { send, calls } = fakeSend({ ok: true, data: {} });
    expect(await saveProfile({ businessName: " Дӯкон ", name: "Азиз" }, send)).toEqual({ ok: true });
    expect(calls).toEqual([{ url: "/api/auth/me", body: { businessName: "Дӯкон", name: "Азиз" } }]);
  });

  it("does not call the API without a business name", async () => {
    const { send, calls } = fakeSend({ ok: true, data: {} });
    expect(await saveProfile({ businessName: "", name: "" }, send)).toEqual({ ok: false, error: "Номи тиҷоратро нависед." });
    expect(calls).toHaveLength(0);
  });
});

describe("changePassword", () => {
  it("sends only the current and the new password", async () => {
    const { send, calls } = fakeSend({ ok: true, data: { changed: true } });
    expect(await changePassword(strong, send)).toEqual({ ok: true });
    expect(calls).toEqual([{ url: "/api/auth/change-password", body: { currentPassword: "old-password", newPassword: "new-password-1" } }]);
  });

  it("does not call the API when the repeat differs", async () => {
    const { send, calls } = fakeSend({ ok: true, data: {} });
    expect((await changePassword({ ...strong, repeat: "x" }, send)).ok).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("explains a wrong current password and too many attempts", async () => {
    expect(await changePassword(strong, fakeSend({ ok: false, status: 400, details: ["currentPassword is incorrect"] }).send)).toEqual({
      ok: false,
      error: "Пароли ҳозира нодуруст аст.",
    });
    expect(await changePassword(strong, fakeSend({ ok: false, status: 429, details: [] }).send, "ru")).toEqual({
      ok: false,
      error: "Слишком много попыток. Подождите немного и попробуйте снова.",
    });
  });
});
