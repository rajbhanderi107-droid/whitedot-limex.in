/* Excel and Word files, written by hand.
 *
 * Both formats are just a ZIP of XML, so the whole thing fits in one file
 * with no dependency — which matters here: the portal is a sales tool that
 * has to keep working offline, and a spreadsheet library would add a few
 * hundred kilobytes plus a supply-chain surface for something the browser
 * can already do.
 *
 * The ZIP is written with no compression (the STORED method, which is part
 * of the spec) — the payload is a few kilobytes of XML and the CPU is a
 * phone's. Files produced here open in Excel, Word, LibreOffice, Google
 * Sheets/Docs and Apple Numbers/Pages without a repair prompt.
 */

/* ─── ZIP ──────────────────────────────────────────────────────────────── */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

interface ZipEntry { name: string; bytes: Uint8Array; crc: number; offset: number }

/** MS-DOS date/time, which is what a ZIP entry stores. */
function dosStamp(d: Date): { time: number; date: number } {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

class ByteWriter {
  private parts: Uint8Array[] = [];
  private len = 0;
  get length() { return this.len; }
  push(b: Uint8Array) { this.parts.push(b); this.len += b.length; }
  u16(n: number) { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); this.push(b); }
  u32(n: number) { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n >>> 0, true); this.push(b); }
  blob(type: string) { return new Blob(this.parts as BlobPart[], { type }); }
}

const utf8 = (s: string) => new TextEncoder().encode(s);

export function zip(files: { name: string; content: string }[], mime: string): Blob {
  const stamp = dosStamp(new Date());
  const w = new ByteWriter();
  const entries: ZipEntry[] = [];

  for (const f of files) {
    const name = utf8(f.name);
    const bytes = utf8(f.content);
    const entry: ZipEntry = { name: f.name, bytes, crc: crc32(bytes), offset: w.length };
    entries.push(entry);
    w.u32(0x04034b50);            // local file header
    w.u16(20); w.u16(0x0800);     // version needed; UTF-8 filename flag
    w.u16(0);                     // stored, no compression
    w.u16(stamp.time); w.u16(stamp.date);
    w.u32(entry.crc); w.u32(bytes.length); w.u32(bytes.length);
    w.u16(name.length); w.u16(0);
    w.push(name);
    w.push(bytes);
  }

  const cdOffset = w.length;
  for (const e of entries) {
    const name = utf8(e.name);
    w.u32(0x02014b50);            // central directory header
    w.u16(20); w.u16(20); w.u16(0x0800);
    w.u16(0);
    w.u16(stamp.time); w.u16(stamp.date);
    w.u32(e.crc); w.u32(e.bytes.length); w.u32(e.bytes.length);
    w.u16(name.length); w.u16(0); w.u16(0);
    w.u16(0); w.u16(0); w.u32(0);
    w.u32(e.offset);
    w.push(name);
  }
  const cdSize = w.length - cdOffset;
  w.u32(0x06054b50);              // end of central directory
  w.u16(0); w.u16(0);
  w.u16(entries.length); w.u16(entries.length);
  w.u32(cdSize); w.u32(cdOffset); w.u16(0);
  return w.blob(mime);
}

export function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
    // Control characters are illegal in XML 1.0 and would make Excel refuse
    // the file; one pasted into a note must not cost someone a report.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

export function saveBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

/* ─── Excel ────────────────────────────────────────────────────────────── */

export type Cell = string | number | null | undefined;
export interface Sheet {
  name: string;
  /** First row is the header; it is frozen, bold and filterable. */
  rows: Cell[][];
  /** Character widths, per column. */
  widths?: number[];
  /** Column indexes shown with 3 decimals (tonnage) or 2 (money). */
  mt?: number[];
  money?: number[];
}

const COL = (n: number): string => {
  let s = "";
  for (let i = n; i >= 0; i = Math.floor(i / 26) - 1) s = String.fromCharCode(65 + (i % 26)) + s;
  return s;
};

/** Excel rejects these characters in a sheet name, and caps it at 31. */
const sheetName = (n: string) => n.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Sheet";

function sheetXml(sh: Sheet): string {
  const width = Math.max(1, ...sh.rows.map((r) => r.length));
  const mtCols = new Set(sh.mt ?? []);
  const moneyCols = new Set(sh.money ?? []);
  const rows = sh.rows.map((row, r) => {
    const cells = row.map((v, c) => {
      const ref = `${COL(c)}${r + 1}`;
      if (r === 0) return `<c r="${ref}" s="1" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
      if (typeof v === "number" && Number.isFinite(v)) {
        const s = mtCols.has(c) ? 2 : moneyCols.has(c) ? 3 : 0;
        return `<c r="${ref}"${s ? ` s="${s}"` : ""}><v>${v}</v></c>`;
      }
      if (v === null || v === undefined || v === "") return "";
      return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    }).join("");
    return `<row r="${r + 1}">${cells}</row>`;
  }).join("");
  const cols = sh.widths?.length
    ? `<cols>${sh.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>`
    : "";
  const last = `${COL(width - 1)}${Math.max(1, sh.rows.length)}`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${last}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${rows}</sheetData><autoFilter ref="A1:${COL(width - 1)}1"/></worksheet>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.000"/><numFmt numFmtId="165" formatCode="#,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

export function buildXlsx(sheets: Sheet[]): Blob {
  const named = sheets.map((s, i) => ({ ...s, name: sheetName(s.name || `Sheet${i + 1}`) }));
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${named.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${named.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${named.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${named.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    { name: "xl/styles.xml", content: STYLES },
    ...named.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, content: sheetXml(s) })),
  ];
  return zip(files, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

/* ─── Word ─────────────────────────────────────────────────────────────── */

export type Block =
  | { t: "h1" | "h2" | "p" | "small"; text: string }
  | { t: "kv"; rows: [string, string][] }
  | { t: "table"; head: string[]; rows: string[][]; widths?: number[] }
  | { t: "spacer" };

const PAGE_TWIP = 9638;          // A4 portrait minus 2 cm margins, in twips

function run(text: string, opts: { b?: boolean; sz?: number; color?: string } = {}): string {
  const props = [
    opts.b ? "<w:b/>" : "",
    opts.color ? `<w:color w:val="${opts.color}"/>` : "",
    opts.sz ? `<w:sz w:val="${opts.sz}"/><w:szCs w:val="${opts.sz}"/>` : "",
  ].join("");
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ""}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}
const para = (inner: string, opts: { before?: number; after?: number } = {}) =>
  `<w:p><w:pPr><w:spacing w:before="${opts.before ?? 0}" w:after="${opts.after ?? 120}"/></w:pPr>${inner}</w:p>`;

function tableXml(head: string[], rows: string[][], widths?: number[], headed = true): string {
  const cols = widths?.length ? widths : (head.length ? head : rows[0] ?? [""]).map(() => 1);
  const total = cols.reduce((a, b) => a + b, 0) || 1;
  const w = (i: number) => Math.floor(((cols[i] ?? 1) / total) * PAGE_TWIP);
  const grid = cols.map((_, i) => `<w:gridCol w:w="${w(i)}"/>`).join("");
  const cell = (text: string, i: number, bold: boolean) =>
    `<w:tc><w:tcPr><w:tcW w:w="${w(i)}" w:type="dxa"/>${bold ? '<w:shd w:val="clear" w:color="auto" w:fill="EFEFEF"/>' : ""}</w:tcPr>${para(run(text, { b: bold, sz: 18 }), { after: 40 })}</w:tc>`;
  const tr = (cells: string[], bold: boolean) =>
    `<w:tr>${bold ? "<w:trPr><w:tblHeader/></w:trPr>" : ""}${cells.map((c, i) => cell(c, i, bold)).join("")}</w:tr>`;
  const borders = '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="D0D0D0"/><w:left w:val="single" w:sz="4" w:color="D0D0D0"/><w:bottom w:val="single" w:sz="4" w:color="D0D0D0"/><w:right w:val="single" w:sz="4" w:color="D0D0D0"/><w:insideH w:val="single" w:sz="4" w:color="D0D0D0"/><w:insideV w:val="single" w:sz="4" w:color="D0D0D0"/></w:tblBorders>';
  const body = rows.map((r) => tr(r, false)).join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="${PAGE_TWIP}" w:type="dxa"/>${borders}</w:tblPr><w:tblGrid>${grid}</w:tblGrid>${headed ? tr(head, true) : ""}${body}</w:tbl>`;
}

function blockXml(b: Block): string {
  switch (b.t) {
    case "h1": return para(run(b.text, { b: true, sz: 36 }), { after: 200 });
    case "h2": return para(run(b.text, { b: true, sz: 26 }), { before: 240, after: 120 });
    case "p": return para(run(b.text, { sz: 20 }));
    case "small": return para(run(b.text, { sz: 16, color: "6B6B6B" }));
    case "kv": return tableXml([], b.rows.map(([k, v]) => [k, v]), [32, 68], false);
    case "table": return tableXml(b.head, b.rows, b.widths);
    case "spacer": return para("");
  }
}

export function buildDocx(blocks: Block[]): Blob {
  const body = blocks.map(blockXml).join("");
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    },
    {
      name: "word/_rels/document.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`,
    },
    {
      name: "word/document.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`,
    },
  ];
  return zip(files, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}
