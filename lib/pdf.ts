import type { Variety } from "./types";
import { buildComparisonTable } from "./comparison";

// Générateur PDF minimal (A4 paysage), sans dépendance externe.
// Utilise les polices standard Helvetica / Helvetica-Bold en encodage WinAnsi,
// ce qui couvre les caractères accentués du français.

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 36;
const LABEL_COLUMN_WIDTH = 150;
const BODY_FONT_SIZE = 8.5;
const HEADER_FONT_SIZE = 9;
const LINE_HEIGHT = 11.5;
const CELL_PADDING = 6;
const FOOTER_HEIGHT = 26;

// Correspondance des caractères hors Latin-1 vers WinAnsi (CP1252).
const WIN_ANSI: Record<string, number> = {
  "\u20AC": 0x80,
  "\u201A": 0x82,
  "\u0192": 0x83,
  "\u201E": 0x84,
  "\u2026": 0x85,
  "\u2020": 0x86,
  "\u2021": 0x87,
  "\u02C6": 0x88,
  "\u2030": 0x89,
  "\u0160": 0x8a,
  "\u2039": 0x8b,
  "\u0152": 0x8c,
  "\u017D": 0x8e,
  "\u2018": 0x91,
  "\u2019": 0x92,
  "\u201C": 0x93,
  "\u201D": 0x94,
  "\u2022": 0x95,
  "\u2013": 0x96,
  "\u2014": 0x97,
  "\u02DC": 0x98,
  "\u2122": 0x99,
  "\u0161": 0x9a,
  "\u203A": 0x9b,
  "\u0153": 0x9c,
  "\u017E": 0x9e,
  "\u0178": 0x9f,
};

function toWinAnsi(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code <= 0x7f) out += ch;
    else if (code >= 0xa0 && code <= 0xff) out += ch;
    else out += String.fromCharCode(WIN_ANSI[ch] ?? 0x3f);
  }
  return out;
}

function pdfString(value: string): string {
  return toWinAnsi(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

const NARROW_CHARS = new Set("iljftrI.,:;'’!|()[]{} ".split(""));
const WIDE_CHARS = new Set("mwMW".split(""));

function charWidth(ch: string, bold: boolean): number {
  if (WIDE_CHARS.has(ch)) return bold ? 0.9 : 0.83;
  if (NARROW_CHARS.has(ch)) return bold ? 0.32 : 0.28;
  if (/[A-ZÀ-Þ]/.test(ch)) return bold ? 0.72 : 0.67;
  if (/[0-9]/.test(ch)) return 0.556;
  return bold ? 0.6 : 0.556;
}

function textWidth(value: string, size: number, bold: boolean): number {
  let width = 0;
  for (const ch of value) width += charWidth(ch, bold);
  return width * size;
}

function wrapText(
  value: string,
  maxWidth: number,
  size: number,
  bold: boolean
): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || textWidth(candidate, size, bold) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function buildComparisonPdf(varieties: Variety[]): Buffer {
  const rows = buildComparisonTable(varieties);
  const generatedAt = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const totalWidth = PAGE_WIDTH - 2 * MARGIN;
  const valueColumnWidth =
    (totalWidth - LABEL_COLUMN_WIDTH) / Math.max(varieties.length, 1);
  const columnWidths = [LABEL_COLUMN_WIDTH, ...varieties.map(() => valueColumnWidth)];

  const columnX: number[] = [];
  let cursor = MARGIN;
  for (const width of columnWidths) {
    columnX.push(cursor);
    cursor += width;
  }

  const pages: string[] = [];
  let ops = "";
  let y = 0;
  let pageTableTop = 0;

  const dividerX = MARGIN + LABEL_COLUMN_WIDTH;

  function text(
    x: number,
    baseline: number,
    value: string,
    size: number,
    bold: boolean,
    gray = 0.15
  ): void {
    ops += `${gray.toFixed(3)} ${gray.toFixed(3)} ${gray.toFixed(3)} rg\n`;
    ops += `BT /${bold ? "F2" : "F1"} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${baseline.toFixed(
      2
    )} Tm (${pdfString(value)}) Tj ET\n`;
  }

  function line(x1: number, y1: number, x2: number, y2: number, gray = 0.85): void {
    ops += `${gray.toFixed(3)} ${gray.toFixed(3)} ${gray.toFixed(3)} RG 0.6 w\n`;
    ops += `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`;
  }

  function fillRect(
    x: number,
    top: number,
    width: number,
    height: number,
    gray: number
  ): void {
    ops += `${gray.toFixed(3)} ${gray.toFixed(3)} ${gray.toFixed(3)} rg\n`;
    ops += `${x.toFixed(2)} ${(top - height).toFixed(2)} ${width.toFixed(
      2
    )} ${height.toFixed(2)} re f\n`;
  }

  function startPage(): void {
    ops = "";
    text(MARGIN, PAGE_HEIGHT - 44, "Comparaison de variétés", 17, true, 0.12);
    text(
      MARGIN,
      PAGE_HEIGHT - 62,
      "MilChoix Sénégal — tableau comparatif des variétés de mil",
      9.5,
      false,
      0.42
    );
    const dateText = `Généré le ${generatedAt}`;
    const dateWidth = textWidth(dateText, 9, false);
    text(PAGE_WIDTH - MARGIN - dateWidth, PAGE_HEIGHT - 44, dateText, 9, false, 0.42);
    line(MARGIN, PAGE_HEIGHT - 74, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 74, 0.82);
    y = PAGE_HEIGHT - 92;
  }

  function drawHeaderRow(): void {
    const cells = rows[0];
    const cellLines = cells.map((cell, index) =>
      wrapText(cell, columnWidths[index] - 2 * CELL_PADDING, HEADER_FONT_SIZE, true)
    );
    const maxLines = Math.max(...cellLines.map((lines) => lines.length), 1);
    const height = maxLines * LINE_HEIGHT + CELL_PADDING;

    pageTableTop = y;
    fillRect(MARGIN, y, totalWidth, height, 0.93);
    cellLines.forEach((lines, index) => {
      lines.forEach((value, lineIndex) => {
        text(
          columnX[index] + CELL_PADDING,
          y - CELL_PADDING - HEADER_FONT_SIZE * 0.8 - lineIndex * LINE_HEIGHT,
          value,
          HEADER_FONT_SIZE,
          true,
          0.15
        );
      });
    });
    y -= height;
    line(MARGIN, y, PAGE_WIDTH - MARGIN, y, 0.82);
  }

  startPage();
  drawHeaderRow();

  rows.slice(1).forEach((row, rowIndex) => {
    const cellLines = row.map((cell, index) =>
      wrapText(cell, columnWidths[index] - 2 * CELL_PADDING, BODY_FONT_SIZE, index === 0)
    );
    const maxLines = Math.max(...cellLines.map((lines) => lines.length), 1);
    const height = maxLines * LINE_HEIGHT + CELL_PADDING / 2;

    if (y - height < MARGIN + FOOTER_HEIGHT) {
      closePage();
      startPage();
      drawHeaderRow();
    }

    if (rowIndex % 2 === 1) {
      fillRect(MARGIN, y, totalWidth, height, 0.975);
    }

    cellLines.forEach((lines, index) => {
      lines.forEach((value, lineIndex) => {
        text(
          columnX[index] + CELL_PADDING,
          y - CELL_PADDING / 2 - BODY_FONT_SIZE * 0.8 - lineIndex * LINE_HEIGHT,
          value,
          BODY_FONT_SIZE,
          index === 0,
          index === 0 ? 0.35 : 0.15
        );
      });
    });

    y -= height;
    line(MARGIN, y, PAGE_WIDTH - MARGIN, y, 0.88);
  });

  // Séparateur vertical entre la colonne des libellés et les variétés, tracé
  // page par page sur la hauteur réelle du tableau.
  function closePage(): void {
    if (pageTableTop > 0) {
      ops += `0.88 0.88 0.88 RG 0.6 w\n`;
      ops += `${dividerX.toFixed(2)} ${y.toFixed(2)} m ${dividerX.toFixed(
        2
      )} ${pageTableTop.toFixed(2)} l S\n`;
    }
    pages.push(ops);
  }

  closePage();

  // Pied de page sur chaque page.
  const footerOps = (page: number): string => {
    let footer = "";
    footer += `0.45 0.45 0.45 rg\n`;
    footer += `BT /F1 8 Tf 1 0 0 1 ${MARGIN} ${MARGIN - 12} Tm (${pdfString(
      "MilChoix Sénégal — données variétales et climatiques"
    )}) Tj ET\n`;
    const pageLabel = `Page ${page} / ${pages.length}`;
    const pageWidth = textWidth(pageLabel, 8, false);
    footer += `0.45 0.45 0.45 rg\n`;
    footer += `BT /F1 8 Tf 1 0 0 1 ${(PAGE_WIDTH - MARGIN - pageWidth).toFixed(2)} ${
      MARGIN - 12
    } Tm (${pdfString(pageLabel)}) Tj ET\n`;
    return footer;
  };

  const pageContents = pages.map((content, index) => content + footerOps(index + 1));

  // Assemblage du fichier PDF.
  const chunks: Buffer[] = [];
  let length = 0;
  const push = (value: string | Buffer): void => {
    const buffer = typeof value === "string" ? Buffer.from(value, "latin1") : value;
    chunks.push(buffer);
    length += buffer.length;
  };

  push("%PDF-1.4\n");
  push(Buffer.from([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const offsets: number[] = [];
  const beginObject = (number: number): void => {
    offsets[number] = length;
    push(`${number} 0 obj\n`);
  };
  const endObject = (): void => {
    push("endobj\n");
  };

  const pageObjectStart = 5;
  const contentObjectStart = 5 + pageContents.length;

  beginObject(1);
  push("<< /Type /Catalog /Pages 2 0 R >>\n");
  endObject();

  const kids = pageContents
    .map((_, index) => `${pageObjectStart + index} 0 R`)
    .join(" ");
  beginObject(2);
  push(`<< /Type /Pages /Kids [${kids}] /Count ${pageContents.length} >>\n`);
  endObject();

  beginObject(3);
  push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\n"
  );
  endObject();

  beginObject(4);
  push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\n"
  );
  endObject();

  pageContents.forEach((content, index) => {
    const pageNumber = pageObjectStart + index;
    const contentNumber = contentObjectStart + index;

    beginObject(pageNumber);
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNumber} 0 R >>\n`
    );
    endObject();

    beginObject(contentNumber);
    const stream = Buffer.from(content, "latin1");
    push(`<< /Length ${stream.length} >>\nstream\n`);
    push(stream);
    push("\nendstream\n");
    endObject();
  });

  const objectCount = 4 + pageContents.length * 2;
  const xrefOffset = length;
  let xref = `xref\n0 ${objectCount + 1}\n0000000000 65535 f\r\n`;
  for (let number = 1; number <= objectCount; number += 1) {
    xref += `${String(offsets[number]).padStart(10, "0")} 00000 n\r\n`;
  }
  push(xref);
  push(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return Buffer.concat(chunks);
}
