export type ShareTarget = {
  canShare?: (data: ShareData) => boolean;
  share?: (data: ShareData) => Promise<void>;
};

export type ShareEnv = {
  navigator: ShareTarget;
  isPhone: boolean;
  download: (file: File) => void;
};

export type ShareOutcome = "shared" | "downloaded" | "cancelled";

export function receiptFileName(day: string) {
  return `kassa-chek-${day}.png`;
}

export async function shareOrDownload(file: File, title: string, env: ShareEnv): Promise<ShareOutcome> {
  const data: ShareData = { files: [file], title };
  const { share, canShare } = env.navigator;
  if (env.isPhone && share && canShare?.(data)) {
    try {
      await share(data);
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    }
  }
  env.download(file);
  return "downloaded";
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function browserShareEnv(): ShareEnv {
  return {
    navigator: {
      canShare: typeof navigator.canShare === "function" ? (data) => navigator.canShare(data) : undefined,
      share: typeof navigator.share === "function" ? (data) => navigator.share(data) : undefined,
    },
    isPhone: window.matchMedia("(pointer: coarse)").matches,
    download: downloadFile,
  };
}
