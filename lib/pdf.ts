import "server-only";
import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/**
 * Tiny PDF toolkit for certificates and receipts (pdf-lib, no browser needed).
 * Fonts: the brand faces (The Seasons, Chunko Bold) are not available as embeddable TTF/OTF in this repo, and the Cormorant /
 * Bagel Fat One files we do have are WOFF2 (not embeddable). So documents use the built-in Times (headings) and Helvetica (body)
 * plus the real logo artwork and the brand colours. Documents are English only (the built-in fonts have no Devanagari / Kannada glyphs).
 */

export const A4 = { w: 595.28, h: 841.89 };
export const BRAND = { tomato: rgb(0.796, 0, 0.004), burgundy: rgb(0.475, 0, 0), ink: rgb(0.165, 0.039, 0.039), muted: rgb(0.42, 0.29, 0.29), cream: rgb(0.996, 0.949, 0.753), line: rgb(0.886, 0.839, 0.776) };

export interface Doc { pdf: PDFDocument; page: PDFPage; serif: PDFFont; serifBold: PDFFont; sans: PDFFont; sansBold: PDFFont; y: number; margin: number }

export async function newDoc(opts: { title: string; subject?: string } ): Promise<Doc> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(opts.title);
  pdf.setSubject(opts.subject ?? "");
  pdf.setAuthor("SAVE A PLATE");
  pdf.setCreator("SAVE A PLATE");
  const [serif, serifBold, sans, sansBold] = await Promise.all([
    pdf.embedFont(StandardFonts.TimesRoman), pdf.embedFont(StandardFonts.TimesRomanBold), pdf.embedFont(StandardFonts.Helvetica), pdf.embedFont(StandardFonts.HelveticaBold),
  ]);
  const page = pdf.addPage([A4.w, A4.h]);
  const d: Doc = { pdf, page, serif, serifBold, sans, sansBold, y: A4.h - 56, margin: 56 };
  page.drawRectangle({ x: 0, y: A4.h - 12, width: A4.w, height: 12, color: BRAND.tomato });
  return d;
}

/** PDF standard fonts only cover WinAnsi: anything else (smart quotes are fine; Indic scripts are not) becomes "?" instead of throwing. */
export const safe = (s: string) => String(s).replace(/[^\x20-\x7E -ÿ‘’“”–—•€]/g, "?").replace(/₹/g, "Rs. ");

export async function drawLogo(d: Doc, x: number, yTop: number, width: number) {
  try {
    const bytes = fs.readFileSync(path.join(process.cwd(), "public", "brand", "save-a-plate-logo-cropped.png"));
    const img = await d.pdf.embedPng(bytes);
    const h = (width * 676) / 847;
    d.page.drawImage(img, { x, y: yTop - h, width, height: h });
    return h;
  } catch { return 0; }
}

export function text(d: Doc, s: string, o: { x?: number; size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; gap?: number; maxWidth?: number } = {}) {
  const size = o.size ?? 11;
  const font = o.font ?? d.sans;
  const x = o.x ?? d.margin;
  const maxW = o.maxWidth ?? A4.w - d.margin - x;
  for (const line of wrap(font, safe(s), size, maxW)) {
    d.page.drawText(line, { x, y: d.y - size, size, font, color: o.color ?? BRAND.ink });
    d.y -= size * 1.35;
  }
  d.y -= o.gap ?? 0;
}

export function wrap(font: PDFFont, s: string, size: number, maxW: number): string[] {
  const out: string[] = [];
  for (const para of s.split("\n")) {
    let line = "";
    for (const w of para.split(/\s+/)) {
      const t = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(t, size) > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}

export function rule(d: Doc, gap = 10) {
  d.y -= gap / 2;
  d.page.drawLine({ start: { x: d.margin, y: d.y }, end: { x: A4.w - d.margin, y: d.y }, thickness: 0.75, color: BRAND.line });
  d.y -= gap / 2;
}

/** Label / value rows in two columns. */
export function rows(d: Doc, items: [string, string][], labelW = 170) {
  for (const [k, v] of items) {
    d.page.drawText(safe(k), { x: d.margin, y: d.y - 11, size: 10, font: d.sansBold, color: BRAND.muted });
    const lines = wrap(d.sans, safe(v), 11, A4.w - d.margin * 2 - labelW);
    lines.forEach((ln, i) => d.page.drawText(ln, { x: d.margin + labelW, y: d.y - 11 - i * 14.5, size: 11, font: d.sans, color: BRAND.ink }));
    d.y -= Math.max(1, lines.length) * 14.5 + 4;
  }
}

export async function qr(d: Doc, data: string, x: number, yTop: number, size = 84) {
  const png = await QRCode.toBuffer(data, { margin: 1, width: 240, errorCorrectionLevel: "M" });
  const img = await d.pdf.embedPng(png);
  d.page.drawImage(img, { x, y: yTop - size, width: size, height: size });
}

export function footer(d: Doc, line: string) {
  const lines = wrap(d.sans, safe(line), 8, A4.w - d.margin * 2);
  lines.forEach((ln, i) => d.page.drawText(ln, { x: d.margin, y: 44 - i * 10.5, size: 8, font: d.sans, color: BRAND.muted }));
}

export const save = async (d: Doc): Promise<Uint8Array> => d.pdf.save();
