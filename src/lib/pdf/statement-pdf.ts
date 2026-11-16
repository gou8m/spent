import { readFile } from "node:fs/promises";
import { join } from "node:path";
import PDFDocument from "pdfkit";
import { format } from "date-fns";
import { formatMoney } from "@/lib/money";
import { STATEMENT_ROW_LIMIT, type StatementData } from "@/lib/statement";

/** Mint design tokens, as plain hex (a PDF has no CSS variables). */
const C = {
  bg: "#F4FAF2",
  surface2: "#E8EEE9",
  border: "#E1EAE2",
  text: "#14231A",
  muted: "#4A5D50",
  accent: "#1B6B33",
  accentDark: "#14502A",
  heroFrom: "#A8F5A8",
  heroTo: "#8DEB9A",
  expense: "#B3261E",
  sky: "#C4E4FF",
  skyText: "#123049",
  series: ["#1B6B33", "#5CC77A", "#1B4F7A", "#7FB8EA", "#B9C8BC", "#6B4FB3", "#B3641F"],
};

const PAGE = { width: 595.28, height: 841.89, margin: 40 };
const CONTENT_W = PAGE.width - PAGE.margin * 2;
const FOOTER_RESERVE = 54;
const BOTTOM = PAGE.height - FOOTER_RESERVE;

const FONT_DIR = join(process.cwd(), "src/app/_font");
const FONTS = { regular: 400, semibold: 600, bold: 700, extra: 800 } as const;

/** Builds the statement PDF (A4, Plus Jakarta Sans) and resolves with its bytes. */
export async function renderStatementPdf(data: StatementData): Promise<Buffer> {
  const fontFiles = await Promise.all(
    Object.entries(FONTS).map(async ([name, weight]) => [name, await readFile(join(FONT_DIR, `plus-jakarta-sans-${weight}.ttf`))] as const),
  );

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: PAGE.margin, bottom: 0, left: PAGE.margin, right: PAGE.margin },
    bufferPages: true,
    info: {
      Title: `Spent. statement ${format(data.start, "d MMM yyyy")} to ${format(data.end, "d MMM yyyy")}`,
      Author: "Spent.",
      Subject: `Statement for ${data.user.name}`,
    },
  });
  for (const [name, bytes] of fontFiles) doc.registerFont(name, bytes);

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const currency = data.user.currency;
  const money = (minor: number, cur = currency, decimals?: number) => formatMoney(minor, cur, undefined, decimals === undefined ? {} : { decimals });
  const period = `${format(data.start, "d MMM yyyy")} – ${format(data.end, "d MMM yyyy")}`;

  // ------------------------------------------------------------------ header band
  const bandY = PAGE.margin - 4;
  const bandH = 112;
  const gradient = doc.linearGradient(PAGE.margin, bandY, PAGE.margin + CONTENT_W, bandY + bandH);
  gradient.stop(0, C.heroFrom).stop(1, C.heroTo);
  doc.roundedRect(PAGE.margin, bandY, CONTENT_W, bandH, 20).fill(gradient);

  doc.font("extra").fontSize(34).fillColor(C.accent).text("Spent.", PAGE.margin + 26, bandY + 24, { characterSpacing: -1.2, lineBreak: false });
  doc.font("semibold").fontSize(10).fillColor(C.accentDark).text("Personal finance statement", PAGE.margin + 27, bandY + 68, { lineBreak: false });

  const rightX = PAGE.margin + CONTENT_W - 26;
  doc.font("bold").fontSize(8).fillColor(C.accentDark).text("STATEMENT PERIOD", rightX - 220, bandY + 28, { width: 220, align: "right", characterSpacing: 0.8, lineBreak: false });
  doc.font("extra").fontSize(15).fillColor(C.text).text(period, rightX - 260, bandY + 42, { width: 260, align: "right", lineBreak: false });
  doc.font("semibold").fontSize(8.5).fillColor(C.accentDark).text(`Generated ${format(data.generatedAt, "d MMM yyyy, h:mm a")}`, rightX - 220, bandY + 68, { width: 220, align: "right", lineBreak: false });

  // ------------------------------------------------------------------ prepared for
  let y = bandY + bandH + 18;
  const cardH = 62;
  doc.roundedRect(PAGE.margin, y, CONTENT_W, cardH, 16).fill(C.surface2);
  const label = (text: string, x: number, yy: number) =>
    doc.font("bold").fontSize(7.5).fillColor(C.muted).text(text.toUpperCase(), x, yy, { characterSpacing: 0.7, lineBreak: false });
  label("Prepared for", PAGE.margin + 20, y + 14);
  doc.font("extra").fontSize(14).fillColor(C.text).text(data.user.name, PAGE.margin + 20, y + 27, { width: 250, ellipsis: true, lineBreak: false });
  doc.font("regular").fontSize(8.5).fillColor(C.muted).text(data.user.email, PAGE.margin + 20, y + 45, { width: 250, ellipsis: true, lineBreak: false });

  const col2 = PAGE.margin + 300;
  label("Currency", col2, y + 14);
  doc.font("bold").fontSize(12).fillColor(C.text).text(currency, col2, y + 28, { lineBreak: false });
  const col3 = PAGE.margin + 400;
  label("Transactions", col3, y + 14);
  doc.font("bold").fontSize(12).fillColor(C.text).text(String(data.totals.count), col3, y + 28, { lineBreak: false });
  y += cardH + 16;

  // ------------------------------------------------------------------ summary tiles
  const tiles: { label: string; value: string; color: string; bg: string; sub?: string }[] = [
    { label: "Money in", value: money(data.totals.income), color: C.accent, bg: C.surface2 },
    { label: "Money out", value: money(data.totals.expense), color: C.text, bg: C.surface2 },
    { label: "Net", value: `${data.totals.net >= 0 ? "+" : "-"}${money(Math.abs(data.totals.net))}`, color: data.totals.net >= 0 ? C.accent : C.expense, bg: C.surface2 },
    {
      label: "Saved",
      value: data.totals.savedPercent === null ? "n/a" : `${data.totals.savedPercent}%`,
      color: C.skyText,
      bg: C.sky,
    },
  ];
  const gap = 10;
  const tileW = (CONTENT_W - gap * (tiles.length - 1)) / tiles.length;
  tiles.forEach((tile, i) => {
    const x = PAGE.margin + i * (tileW + gap);
    doc.roundedRect(x, y, tileW, 64, 16).fill(tile.bg);
    doc.font("bold").fontSize(7.5).fillColor(tile.bg === C.sky ? C.skyText : C.muted).text(tile.label.toUpperCase(), x + 14, y + 13, { characterSpacing: 0.7, lineBreak: false });
    // Shrink the figure until it fits the tile on one line (a lakh-sized amount at 15.5pt does not).
    let fontSize = 15.5;
    doc.font("extra");
    while (fontSize > 9 && doc.fontSize(fontSize).widthOfString(tile.value) > tileW - 28) fontSize -= 0.5;
    doc.fontSize(fontSize).fillColor(tile.color).text(tile.value, x + 14, y + 30 + (15.5 - fontSize) / 2, { lineBreak: false });
  });
  y += 64 + 24;

  const heading = (text: string, yy: number) => {
    doc.font("extra").fontSize(13).fillColor(C.text).text(text, PAGE.margin, yy, { characterSpacing: -0.3, lineBreak: false });
    return yy + 24;
  };
  const ensure = (needed: number) => {
    if (y + needed > BOTTOM) {
      doc.addPage();
      y = PAGE.margin;
    }
  };

  // ------------------------------------------------------------------ where the money went
  if (data.categories.length > 0) {
    ensure(40 + data.categories.length * 26);
    y = heading("Where the money went", y);
    const barX = PAGE.margin + 170;
    const barW = CONTENT_W - 170 - 130;
    data.categories.forEach((cat, i) => {
      const color = cat.name === "Other" ? C.series[4] : C.series[i % C.series.length];
      doc.roundedRect(PAGE.margin, y + 3, 9, 9, 3).fill(color);
      doc.font("semibold").fontSize(9.5).fillColor(C.text).text(cat.name, PAGE.margin + 18, y + 2, { width: 140, ellipsis: true, lineBreak: false });
      doc.roundedRect(barX, y + 4, barW, 7, 3.5).fill(C.surface2);
      doc.roundedRect(barX, y + 4, Math.max(5, (barW * cat.percent) / 100), 7, 3.5).fill(color);
      doc.font("bold").fontSize(9.5).fillColor(C.text).text(money(cat.amount), barX + barW + 10, y + 2, { width: 80, align: "right", lineBreak: false });
      doc.font("regular").fontSize(9).fillColor(C.muted).text(`${Math.round(cat.percent)}%`, barX + barW + 94, y + 2, { width: 26, align: "right", lineBreak: false });
      y += 26;
    });
    y += 12;
  }

  // ------------------------------------------------------------------ accounts
  if (data.accounts.length > 0) {
    ensure(60 + data.accounts.length * 30);
    y = heading("Accounts", y);
    const colIn = PAGE.margin + CONTENT_W - 120;
    const colOut = PAGE.margin + CONTENT_W - 10;
    doc.font("bold").fontSize(7.5).fillColor(C.muted);
    doc.text("ACCOUNT", PAGE.margin + 14, y, { characterSpacing: 0.7, lineBreak: false });
    doc.text("MONEY IN", colIn - 90, y, { width: 90, align: "right", characterSpacing: 0.7, lineBreak: false });
    doc.text("MONEY OUT", colOut - 100, y, { width: 100, align: "right", characterSpacing: 0.7, lineBreak: false });
    y += 16;
    data.accounts.forEach((acc, i) => {
      if (i % 2 === 0) doc.roundedRect(PAGE.margin, y - 5, CONTENT_W, 26, 10).fill(C.bg);
      doc.font("semibold").fontSize(9.5).fillColor(C.text).text(acc.name, PAGE.margin + 14, y + 2, { width: 230, ellipsis: true, lineBreak: false });
      doc.font("bold").fontSize(9.5).fillColor(C.accent).text(money(acc.moneyIn, acc.currency), colIn - 110, y + 2, { width: 110, align: "right", lineBreak: false });
      doc.font("bold").fontSize(9.5).fillColor(C.text).text(money(acc.moneyOut, acc.currency), colOut - 110, y + 2, { width: 110, align: "right", lineBreak: false });
      y += 26;
    });
    y += 18;
  }

  // ------------------------------------------------------------------ transactions table
  const cols = {
    date: PAGE.margin + 14,
    details: PAGE.margin + 78,
    account: PAGE.margin + 300,
    amountRight: PAGE.margin + CONTENT_W - 14,
  };
  const ROW_H = 31;

  const tableHeader = () => {
    doc.roundedRect(PAGE.margin, y, CONTENT_W, 26, 10).fill(C.accent);
    doc.font("bold").fontSize(7.5).fillColor("#FFFFFF");
    doc.text("DATE", cols.date, y + 9, { characterSpacing: 0.7, lineBreak: false });
    doc.text("DETAILS", cols.details, y + 9, { characterSpacing: 0.7, lineBreak: false });
    doc.text("ACCOUNT", cols.account, y + 9, { characterSpacing: 0.7, lineBreak: false });
    doc.text("AMOUNT", cols.amountRight - 120, y + 9, { width: 120, align: "right", characterSpacing: 0.7, lineBreak: false });
    y += 32;
  };

  ensure(26 + 32 + ROW_H * 2);
  y = heading(`Transactions (${data.totals.count})`, y);

  if (data.transactions.length === 0) {
    doc.roundedRect(PAGE.margin, y, CONTENT_W, 70, 16).fill(C.surface2);
    doc.font("bold").fontSize(11).fillColor(C.text).text("No transactions in this period", PAGE.margin, y + 22, { width: CONTENT_W, align: "center", lineBreak: false });
    doc.font("regular").fontSize(9).fillColor(C.muted).text("Pick a longer range, or add transactions in Spent.", PAGE.margin, y + 40, { width: CONTENT_W, align: "center", lineBreak: false });
    y += 80;
  } else {
    tableHeader();
    data.transactions.forEach((t, i) => {
      if (y + ROW_H > BOTTOM) {
        doc.addPage();
        y = PAGE.margin;
        tableHeader();
      }
      if (i % 2 === 0) doc.roundedRect(PAGE.margin, y - 4, CONTENT_W, ROW_H - 1, 9).fill(C.bg);

      doc.font("semibold").fontSize(8.5).fillColor(C.muted).text(format(t.date, "d MMM"), cols.date, y + 3, { lineBreak: false });
      doc.font("regular").fontSize(7.5).fillColor(C.muted).text(format(t.date, "yyyy"), cols.date, y + 14, { lineBreak: false });

      doc.font("bold").fontSize(9.5).fillColor(C.text).text(t.title, cols.details, y + 2, { width: 210, ellipsis: true, lineBreak: false });
      const caption = t.type === "TRANSFER" ? `Transfer${t.transferTo ? ` to ${t.transferTo}` : ""}` : (t.category ?? "Uncategorised");
      doc.font("regular").fontSize(7.5).fillColor(C.muted).text(caption + (t.note ? `  ·  ${t.note}` : ""), cols.details, y + 15, { width: 210, ellipsis: true, lineBreak: false });

      doc.font("regular").fontSize(8.5).fillColor(C.muted).text(t.account, cols.account, y + 7, { width: 120, ellipsis: true, lineBreak: false });

      const sign = t.type === "INCOME" ? "+" : t.type === "EXPENSE" ? "-" : "";
      doc.font("bold").fontSize(9.5).fillColor(t.type === "INCOME" ? C.accent : C.text).text(`${sign}${money(t.amount, t.currency)}`, cols.amountRight - 120, y + 7, { width: 120, align: "right", lineBreak: false });
      y += ROW_H;
    });
    y += 8;
  }

  // ------------------------------------------------------------------ notes
  const notes: string[] = [];
  if (data.totals.otherCurrencyCount > 0) {
    notes.push(`${data.totals.otherCurrencyCount} transaction${data.totals.otherCurrencyCount === 1 ? "" : "s"} in other currencies are listed but not included in the ${currency} totals above.`);
  }
  if (data.truncated) notes.push(`Only the first ${STATEMENT_ROW_LIMIT.toLocaleString("en-US")} transactions are shown. Choose a shorter range to see the rest.`);
  notes.push("Generated by Spent. from the transactions you entered. It is a personal record, not a bank statement. Transfers between your own accounts are shown without a sign.");
  const noteText = notes.join(" ");
  doc.font("regular").fontSize(8);
  const noteH = doc.heightOfString(noteText, { width: CONTENT_W - 32 }) + 24;
  ensure(noteH + 6);
  doc.roundedRect(PAGE.margin, y, CONTENT_W, noteH, 14).fill(C.surface2);
  doc.font("regular").fontSize(8).fillColor(C.muted).text(noteText, PAGE.margin + 16, y + 12, { width: CONTENT_W - 32, lineGap: 2 });

  // ------------------------------------------------------------------ footer on every page
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0; // otherwise writing near the bottom edge would add a page
    const fy = PAGE.height - 38;
    doc.moveTo(PAGE.margin, fy - 8).lineTo(PAGE.margin + CONTENT_W, fy - 8).lineWidth(0.6).strokeColor(C.border).stroke();
    doc.font("extra").fontSize(10).fillColor(C.accent).text("Spent.", PAGE.margin, fy, { lineBreak: false });
    doc.font("regular").fontSize(8).fillColor(C.muted).text(`${data.user.name}  ·  ${period}`, PAGE.margin + 50, fy + 2, { width: CONTENT_W - 130, lineBreak: false, ellipsis: true });
    doc.font("semibold").fontSize(8).fillColor(C.muted).text(`Page ${i - range.start + 1} of ${range.count}`, PAGE.margin + CONTENT_W - 80, fy + 2, { width: 80, align: "right", lineBreak: false });
  }

  doc.end();
  return done;
}
