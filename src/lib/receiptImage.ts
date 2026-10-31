import { formatSomoni } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import type { Translate } from "@/lib/i18n/translate";
import { cashSabtEntries, debtSabtEntries, type SabtEntry } from "@/lib/sabt";
import { receiptNoteKey } from "@/lib/sabtText";

export type Tone = "income" | "expense";

export type ReceiptImageData = {
  title: string;
  businessName: string | null;
  when: string;
  rows: { title: string; note: string; amount: string; tone: Tone }[];
  debts: { title: string; amount: string }[];
  debtNote: string;
  totalLabel: string;
  total: string;
  totalTone: Tone;
  savedNote: string;
  stamp: string;
};

export type Measure = (text: string) => number;

export function receiptImageData(entries: SabtEntry[], profit: number, t: Translate, locale: Locale, businessName: string | null, when: string): ReceiptImageData {
  const note = (entry: SabtEntry) => {
    const key = receiptNoteKey(entry);
    return key ? t(key) : entry.note;
  };
  return {
    title: t("sabt.receipt.title"),
    businessName: businessName?.trim() || null,
    when,
    rows: cashSabtEntries(entries).map((entry) => ({
      title: entry.title,
      note: note(entry),
      amount: formatSomoni(entry.kind === "income" ? entry.amount : -entry.amount, { sign: true, unit: false, locale }),
      tone: entry.kind === "income" ? "income" : "expense",
    })),
    debts: debtSabtEntries(entries).map((entry) => ({ title: entry.title, amount: formatSomoni(entry.amount, { unit: false, locale }) })),
    debtNote: `${t("sabt.receipt.debtBefore")}${t("nav.debts")}${t("sabt.receipt.debtAfter")}`,
    totalLabel: profit >= 0 ? t("sabt.receipt.profit") : t("sabt.receipt.loss"),
    total: formatSomoni(profit, { sign: true, unit: false, locale }),
    totalTone: profit >= 0 ? "income" : "expense",
    savedNote: t("sabt.receipt.saved"),
    stamp: t("sabt.receipt.stamp"),
  };
}

export function fitText(text: string, maxWidth: number, measure: Measure) {
  if (measure(text) <= maxWidth) return text;
  const chars = Array.from(text);
  while (chars.length > 0 && measure(`${chars.join("").trimEnd()}…`) > maxWidth) chars.pop();
  return `${chars.join("").trimEnd()}…`;
}

export function wrapText(text: string, maxWidth: number, measure: Measure) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.map((item) => fitText(item, maxWidth, measure));
}

export function receiptText(data: ReceiptImageData) {
  return [
    data.title,
    data.businessName ?? "",
    data.when,
    ...data.rows.flatMap((row) => [row.title, row.note, row.amount]),
    ...data.debts.flatMap((debt) => [debt.title, debt.amount]),
    data.debtNote,
    data.totalLabel,
    data.total,
    data.savedNote,
    data.stamp,
    "…",
  ].join(" ");
}

const COLORS = {
  ink: "#1b2340",
  ink2: "#5b6480",
  ink3: "#8a93ad",
  pen: "#2d4bd8",
  green: "#1e9e6a",
  red: "#d6453d",
  paper: "#f6f8fd",
  grid: "#e1e7f6",
  card: "#ffffff",
  line: "#dde2ef",
  lineStrong: "#c9d0e3",
};

const SCALE = 3;
const CANVAS_WIDTH = 400;
const RECEIPT_X = 30;
const RECEIPT_WIDTH = 340;
const PAD = 24;
const TOOTH = 7;
const CONTENT_X = RECEIPT_X + PAD;
const CONTENT_WIDTH = RECEIPT_WIDTH - PAD * 2;
const CONTENT_RIGHT = CONTENT_X + CONTENT_WIDTH;

type Fonts = { display: string; sans: string; mono: string; hand: string };

function fontFamilies(): Fonts {
  const style = getComputedStyle(document.body);
  const read = (name: string, fallback: string) => {
    const value = style.getPropertyValue(name).trim();
    return value ? `${value}, ${fallback}` : fallback;
  };
  return {
    display: read("--font-geologica", "Arial, sans-serif"),
    sans: read("--font-inter", "Arial, sans-serif"),
    mono: read("--font-fira-code", "ui-monospace, monospace"),
    hand: read("--font-caveat", "cursive"),
  };
}

function fontSpecs(fonts: Fonts) {
  return [`700 15px ${fonts.display}`, `800 15px ${fonts.display}`, `400 14px ${fonts.mono}`, `700 14px ${fonts.mono}`, `400 11px ${fonts.sans}`, `600 13px ${fonts.sans}`, `600 20px ${fonts.hand}`];
}

async function loadFonts(fonts: Fonts, text: string) {
  await Promise.all(fontSpecs(fonts).map((spec) => document.fonts.load(spec, text).catch(() => [])));
  await document.fonts.ready;
}

function zigzagPath(ctx: CanvasRenderingContext2D, top: number, bottom: number) {
  const left = RECEIPT_X;
  const right = RECEIPT_X + RECEIPT_WIDTH;
  const step = TOOTH * 2;
  ctx.beginPath();
  ctx.moveTo(left, top + TOOTH);
  for (let x = left; x < right; x += step) {
    ctx.lineTo(Math.min(x + TOOTH, right), top);
    ctx.lineTo(Math.min(x + step, right), top + TOOTH);
  }
  ctx.lineTo(right, bottom - TOOTH);
  for (let x = right; x > left; x -= step) {
    ctx.lineTo(Math.max(x - TOOTH, left), bottom);
    ctx.lineTo(Math.max(x - step, left), bottom - TOOTH);
  }
  ctx.closePath();
}

function paperBackground(ctx: CanvasRenderingContext2D, height: number) {
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let x = 0.5; x < CANVAS_WIDTH; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0.5; y < height; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
}

function divider(ctx: CanvasRenderingContext2D, y: number, color: string, dash: number[]) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(CONTENT_X, y);
  ctx.lineTo(CONTENT_RIGHT, y);
  ctx.stroke();
  ctx.restore();
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function stamp(ctx: CanvasRenderingContext2D, text: string, centerY: number, fonts: Fonts) {
  ctx.save();
  ctx.font = `800 15px ${fonts.display}`;
  const width = ctx.measureText(text).width + 24 + text.length * 1.2;
  const height = 32;
  ctx.translate(RECEIPT_X + RECEIPT_WIDTH / 2, centerY);
  ctx.rotate((-13 * Math.PI) / 180);
  ctx.globalAlpha = 0.85;
  roundedRect(ctx, -width / 2, -height / 2, width, height, 10);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.pen;
  ctx.stroke();
  ctx.fillStyle = COLORS.pen;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "1.2px";
  ctx.fillText(text, 0, 1);
  ctx.restore();
}

function paint(ctx: CanvasRenderingContext2D, data: ReceiptImageData, fonts: Fonts, live: boolean) {
  const measureWith = (font: string): Measure => (text) => {
    ctx.font = font;
    return ctx.measureText(text).width;
  };
  const text = (value: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = "left") => {
    if (!live) return;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(value, x, y);
  };
  const center = RECEIPT_X + RECEIPT_WIDTH / 2;
  const top = 26;
  let y = top + TOOTH + PAD + 12;

  if (live) ctx.letterSpacing = "0.9px";
  text(data.title, center, y, `700 15px ${fonts.display}`, COLORS.ink, "center");
  if (live) ctx.letterSpacing = "0px";
  if (data.businessName) {
    y += 20;
    text(fitText(data.businessName, CONTENT_WIDTH, measureWith(`600 13px ${fonts.sans}`)), center, y, `600 13px ${fonts.sans}`, COLORS.ink, "center");
  }
  y += 18;
  text(data.when, center, y, `400 11px ${fonts.mono}`, COLORS.ink2, "center");
  y += 18;
  if (live) divider(ctx, y, COLORS.lineStrong, [6, 4]);
  y += 8;

  if (data.rows.length === 0) y += 40;
  data.rows.forEach((row, index) => {
    const amountFont = `700 14px ${fonts.mono}`;
    const amountWidth = measureWith(amountFont)(row.amount);
    const titleWidth = CONTENT_WIDTH - amountWidth - 12;
    text(fitText(row.title, titleWidth, measureWith(`400 14px ${fonts.mono}`)), CONTENT_X, y + 24, `400 14px ${fonts.mono}`, COLORS.ink);
    text(fitText(row.note, titleWidth, measureWith(`400 11px ${fonts.sans}`)), CONTENT_X, y + 40, `400 11px ${fonts.sans}`, COLORS.ink3);
    text(row.amount, CONTENT_RIGHT, y + 31, amountFont, row.tone === "income" ? COLORS.green : COLORS.red, "right");
    y += 52;
    if (index < data.rows.length - 1 && live) divider(ctx, y, COLORS.line, [1.5, 3]);
  });

  if (data.debts.length > 0) {
    const noteLines = wrapText(data.debtNote, CONTENT_WIDTH - 24, measureWith(`400 11px ${fonts.sans}`));
    const boxTop = y + 12;
    const boxHeight = 20 + data.debts.length * 20 + noteLines.length * 15 + 6;
    if (live) {
      ctx.save();
      roundedRect(ctx, CONTENT_X, boxTop, CONTENT_WIDTH, boxHeight, 12);
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = COLORS.ink3;
      ctx.stroke();
      ctx.restore();
    }
    let lineY = boxTop + 24;
    for (const debt of data.debts) {
      const amountWidth = measureWith(`700 13px ${fonts.sans}`)(debt.amount);
      text(fitText(debt.title, CONTENT_WIDTH - 36 - amountWidth, measureWith(`400 13px ${fonts.sans}`)), CONTENT_X + 12, lineY, `400 13px ${fonts.sans}`, COLORS.ink2);
      text(debt.amount, CONTENT_RIGHT - 12, lineY, `700 13px ${fonts.sans}`, COLORS.ink2, "right");
      lineY += 20;
    }
    for (const line of noteLines) {
      text(line, CONTENT_X + 12, lineY + 2, `400 11px ${fonts.sans}`, COLORS.ink2);
      lineY += 15;
    }
    y = boxTop + boxHeight;
  }

  y += 10;
  if (live) divider(ctx, y, COLORS.lineStrong, [6, 4]);
  y += 34;
  text(data.totalLabel, CONTENT_X, y, `700 22px ${fonts.mono}`, COLORS.ink);
  text(data.total, CONTENT_RIGHT, y, `700 22px ${fonts.mono}`, data.totalTone === "income" ? COLORS.green : COLORS.red, "right");
  y += 34;
  text(data.savedNote, center, y, `600 20px ${fonts.hand}`, COLORS.ink2, "center");
  y += 40;
  if (live) stamp(ctx, data.stamp, y, fonts);
  y += 24 + 34 + TOOTH;
  return { top, bottom: y, height: y + 40 };
}

export async function renderReceiptPng(data: ReceiptImageData): Promise<Blob> {
  const fonts = fontFamilies();
  await loadFonts(fonts, receiptText(data));

  const canvas = document.createElement("canvas");
  const probe = canvas.getContext("2d");
  if (!probe) throw new Error("Canvas is not supported");
  const { height } = paint(probe, data, fonts, false);

  canvas.width = CANVAS_WIDTH * SCALE;
  canvas.height = Math.ceil(height * SCALE);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");
  ctx.scale(SCALE, SCALE);
  paperBackground(ctx, height);

  const { top, bottom } = paint(ctx, data, fonts, false);
  ctx.save();
  ctx.shadowColor = "rgba(27,35,64,0.16)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 14;
  zigzagPath(ctx, top, bottom);
  ctx.fillStyle = COLORS.card;
  ctx.fill();
  ctx.restore();
  paint(ctx, data, fonts, true);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png");
  });
}
