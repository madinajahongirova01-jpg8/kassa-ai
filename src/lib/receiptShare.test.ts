import { describe, expect, it, vi } from "vitest";
import { receiptFileName, shareOrDownload, type ShareEnv } from "./receiptShare";

function receiptFile() {
  return new File(["png"], receiptFileName("2026-10-31"), { type: "image/png" });
}

function env(overrides: Partial<ShareEnv> = {}, share?: ShareEnv["navigator"]["share"], canShare: boolean = true) {
  const download = vi.fn<(file: File) => void>();
  return {
    download,
    env: { isPhone: true, download, navigator: { canShare: () => canShare, share }, ...overrides } satisfies ShareEnv,
  };
}

describe("receiptFileName", () => {
  it("names the PNG after the business day", () => {
    expect(receiptFileName("2026-10-31")).toBe("kassa-chek-2026-10-31.png");
  });
});

describe("shareOrDownload", () => {
  it("opens the share sheet with the PNG on a phone that can share files", async () => {
    const share = vi.fn<(data: ShareData) => Promise<void>>(async () => undefined);
    const { env: shareEnv, download } = env({}, share);
    const file = receiptFile();

    await expect(shareOrDownload(file, "Чек — Kassa AI", shareEnv)).resolves.toBe("shared");

    expect(share).toHaveBeenCalledWith({ files: [file], title: "Чек — Kassa AI" });
    expect(download).not.toHaveBeenCalled();
  });

  it("downloads the PNG when the browser cannot share files", async () => {
    const share = vi.fn<(data: ShareData) => Promise<void>>(async () => undefined);
    const { env: shareEnv, download } = env({}, share, false);
    const file = receiptFile();

    await expect(shareOrDownload(file, "Чек", shareEnv)).resolves.toBe("downloaded");

    expect(share).not.toHaveBeenCalled();
    expect(download).toHaveBeenCalledWith(file);
  });

  it("downloads the PNG when there is no Web Share API", async () => {
    const { env: shareEnv, download } = env({ navigator: {} });

    await expect(shareOrDownload(receiptFile(), "Чек", shareEnv)).resolves.toBe("downloaded");

    expect(download).toHaveBeenCalledOnce();
  });

  it("downloads on a computer even if it could share", async () => {
    const share = vi.fn<(data: ShareData) => Promise<void>>(async () => undefined);
    const { env: shareEnv, download } = env({ isPhone: false }, share);

    await expect(shareOrDownload(receiptFile(), "Чек", shareEnv)).resolves.toBe("downloaded");

    expect(share).not.toHaveBeenCalled();
    expect(download).toHaveBeenCalledOnce();
  });

  it("does nothing more when the user closes the share sheet", async () => {
    const share = vi.fn<(data: ShareData) => Promise<void>>(async () => {
      throw new DOMException("Share canceled", "AbortError");
    });
    const { env: shareEnv, download } = env({}, share);

    await expect(shareOrDownload(receiptFile(), "Чек", shareEnv)).resolves.toBe("cancelled");

    expect(download).not.toHaveBeenCalled();
  });

  it("falls back to a download when sharing fails for another reason", async () => {
    const share = vi.fn<(data: ShareData) => Promise<void>>(async () => {
      throw new DOMException("No user gesture", "NotAllowedError");
    });
    const { env: shareEnv, download } = env({}, share);

    await expect(shareOrDownload(receiptFile(), "Чек", shareEnv)).resolves.toBe("downloaded");

    expect(download).toHaveBeenCalledOnce();
  });
});
