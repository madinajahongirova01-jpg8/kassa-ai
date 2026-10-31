import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { INSTALL_DISMISSED_KEY, installMode, isIosDevice, offlinePageHtml, readDismissed, saveDismissed } from "@/lib/pwa";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

function brokenStorage(): Storage {
  throw new Error("storage is blocked");
}

const base = { standalone: false, dismissed: false, ios: false, canPrompt: false };

describe("installMode", () => {
  it("offers the install button when the browser can prompt", () => {
    expect(installMode({ ...base, canPrompt: true })).toBe("prompt");
  });

  it("shows the Share instructions on iPhone", () => {
    expect(installMode({ ...base, ios: true })).toBe("ios");
  });

  it("stays hidden when installed, dismissed or not supported", () => {
    expect(installMode({ ...base, canPrompt: true, standalone: true })).toBeNull();
    expect(installMode({ ...base, ios: true, dismissed: true })).toBeNull();
    expect(installMode(base)).toBeNull();
  });
});

describe("isIosDevice", () => {
  it("detects iPhone and iPad but not Android or desktop", () => {
    expect(isIosDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", 5)).toBe(true);
    expect(isIosDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);
    expect(isIosDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false);
    expect(isIosDevice("Mozilla/5.0 (Linux; Android 14; Pixel 8)", 5)).toBe(false);
  });
});

describe("dismissed flag", () => {
  it("is remembered in storage", () => {
    const storage = memoryStorage();
    expect(readDismissed(() => storage)).toBe(false);
    saveDismissed(() => storage);
    expect(storage.getItem(INSTALL_DISMISSED_KEY)).toBe("1");
    expect(readDismissed(() => storage)).toBe(true);
  });

  it("does not throw when storage is blocked", () => {
    expect(readDismissed(brokenStorage)).toBe(false);
    expect(() => saveDismissed(brokenStorage)).not.toThrow();
  });
});

describe("manifest", () => {
  it("opens the app standalone from /app with normal and maskable icons", () => {
    const data = manifest();
    expect(data).toMatchObject({ name: "Kassa AI", start_url: "/app", display: "standalone" });
    expect(data.icons?.map((icon) => `${icon.sizes} ${icon.purpose}`)).toEqual(["192x192 any", "512x512 any", "512x512 maskable"]);
  });
});

describe("offlinePageHtml", () => {
  it("says there is no internet in all three languages", () => {
    const html = offlinePageHtml();
    expect(html).toContain("Интернет нест");
    expect(html).toContain("Нет интернета");
    expect(html).toContain("No internet");
    expect(html).not.toMatch(/<script/i);
  });
});
