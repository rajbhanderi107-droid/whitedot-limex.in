import { sourceFolderOf, SOURCE_LABEL } from "./sources.js";
/* Turning the books into files someone else can read.
 *
 * Raj's weekly forms go out as a spreadsheet and a document, so the Customer
 * Book does the same: an Excel workbook for the numbers and a Word document
 * for the read-through. Rupee columns are only filled in where a rate was
 * actually agreed — an unpriced order exports as blank, never as zero. */

import { buildXlsx, buildDocx, saveBlob, type Sheet, type Block, type Cell } from "../lib/office.js";
import { ORDER_STATUS_LABEL, type RbLeg, type RbMark, type RbStop, type RbSettings, type RbOrder } from "./types.js";
import {
  addrOf, conOf, customerTotals, expectedMtOf, fmtDate, fmtDateLong, liveOrders, num, ordersOf, phoneOf,
  OUTMAP, polymersOf, processesOf, RESULT_LABEL, samplesOf, today, tonnesOf, type Row,
} from "./logic.js";

const stamp = () => today();
const legName = (legById: Record<string, RbLeg>, id: string) => legById[id]?.name ?? id;

/* ─── Lead Book ────────────────────────────────────────────────────────── */

export function leadBookSheet(rows: Row[], legById: Record<string, RbLeg>): Sheet {
  const head = [
    "Company", "Leg", "Contact", "Phone", "Lead since", "Next step",
    "Expected MT/month",
    "Their volume (t/mo)", "Polymers", "Processes", "Samples out", "Follow-up due", "Note", "Source folder",
  ];
  const body: Cell[][] = rows.map(({ s, m }) => {
    const c = conOf(m);
    const open = samplesOf(m).filter((x) => x.result === "PENDING").length;
    return [
      s.name, legName(legById, s.legId), c.n, phoneOf(s, m), m?.leadOn ?? "", m?.nextStep ?? "",
      expectedMtOf(m),
      tonnesOf(m), polymersOf(m).join(", "), processesOf(m).join(", "),
      open || "", m?.dueOn ?? "", m?.note ?? "", SOURCE_LABEL[sourceFolderOf(s,m)],
    ];
  });
  return {
    name: "Lead Book",
    rows: [head, ...body],
    widths: [34, 18, 18, 15, 12, 30, 17, 18, 16, 18, 12, 13, 44, 18],
    mt: [6, 7],
  };
}

export function exportLeadBook(rows: Row[], legById: Record<string, RbLeg>): void {
  saveBlob(`whitedot-lead-book-${stamp()}.xlsx`, buildXlsx([leadBookSheet(rows, legById)]));
}

/* ─── Visit Follow-ups ─────────────────────────────────────────────────── */

/** The common visit list: who was called on, what they said, and what is
 *  owed them next. Ordered the way the page orders it, so the file reads in
 *  the same sequence as the screen it came from. */
export function followUpBookSheet(rows: Row[], legById: Record<string, RbLeg>): Sheet {
  const head = [
    "Company", "Leg", "Address", "Contact", "Phone", "Starred", "Visited on",
    "Outcome", "Follow-up due", "Samples out", "Their volume (t/mo)", "Polymers", "Processes", "Note", "Source folder",
  ];
  const body: Cell[][] = rows.map(({ s, m }) => {
    const c = conOf(m);
    const open = samplesOf(m).filter((x) => x.result === "PENDING").length;
    return [
      s.name, legName(legById, s.legId), addrOf(s, m), c.n, phoneOf(s, m),
      m?.starred ? "Yes" : "", m?.tickedOn ?? "",
      m?.outcome ? OUTMAP[m.outcome] : "", m?.dueOn ?? "", open || "",
      tonnesOf(m), polymersOf(m).join(", "), processesOf(m).join(", "), m?.note ?? "", SOURCE_LABEL[sourceFolderOf(s,m)],
    ];
  });
  return {
    name: "Visit Follow-ups",
    rows: [head, ...body],
    widths: [34, 18, 40, 18, 15, 9, 12, 14, 13, 12, 18, 16, 18, 44, 18],
  };
}

export function exportFollowUpBookXlsx(rows: Row[], legById: Record<string, RbLeg>): void {
  saveBlob(`whitedot-visit-followups-${stamp()}.xlsx`, buildXlsx([followUpBookSheet(rows, legById)]));
}

export function followUpBookBlocks(rows: Row[], legById: Record<string, RbLeg>): Block[] {
  const due = rows.filter((r) => r.m?.dueOn && r.m.dueOn <= today()).length;
  const starred = rows.filter((r) => r.m?.starred).length;
  const open = rows.reduce((a, r) => a + samplesOf(r.m).filter((x) => x.result === "PENDING").length, 0);

  const blocks: Block[] = [
    { t: "h1", text: "WhiteDot — LIMEX Visit Follow-ups" },
    {
      t: "small",
      text: `Prepared ${fmtDateLong(stamp())} · ${rows.length} visited compan${rows.length === 1 ? "y" : "ies"}`,
    },
    {
      t: "kv",
      rows: [
        ["Visited", String(rows.length)],
        ["Follow-ups due", String(due)],
        ["Starred", String(starred)],
        ["Samples awaiting a result", String(open)],
      ],
    },
  ];

  for (const { s, m } of rows) {
    const c = conOf(m);
    const openHere = samplesOf(m).filter((x) => x.result === "PENDING").length;
    blocks.push({ t: "h2", text: s.name });
    blocks.push({
      t: "kv",
      rows: [
        ["Source folder", SOURCE_LABEL[sourceFolderOf(s,m)]],
        ["Leg", legName(legById, s.legId)],
        ["Address", addrOf(s, m) || "—"],
        ["Contact", [c.n, phoneOf(s, m)].filter(Boolean).join(" · ") || "—"],
        ["Visited", m?.tickedOn ? fmtDate(m.tickedOn) : "starred, not yet visited"],
        ["Outcome", m?.outcome ? OUTMAP[m.outcome] : "—"],
        ["Follow-up due", m?.dueOn ? fmtDate(m.dueOn) : "no date set"],
        ["Samples out", openHere ? String(openHere) : "—"],
      ],
    });
    if (m?.note) blocks.push({ t: "p", text: m.note });
  }
  return blocks;
}

export function exportFollowUpBookDocx(rows: Row[], legById: Record<string, RbLeg>): void {
  saveBlob(`whitedot-visit-followups-${stamp()}.docx`, buildDocx(followUpBookBlocks(rows, legById)));
}

/* ─── Customer Book ────────────────────────────────────────────────────── */

function customerRow(s: RbStop, m: RbMark | undefined, legById: Record<string, RbLeg>): Cell[] {
  const t = customerTotals(m);
  const c = conOf(m);
  return [
    s.name, legName(legById, s.legId), c.n, phoneOf(s, m), addrOf(s, m),
    m?.gstNumber ?? "", m?.paymentTerms ?? "", m?.customerOn ?? "",
    t.count, t.mt, t.last ?? "", SOURCE_LABEL[sourceFolderOf(s,m)],
  ];
}

function orderRow(o: RbOrder, company: string): Cell[] {
  return [
    o.orderNo, o.orderedOn, company, o.grade, num(o.quantityMt),
    ORDER_STATUS_LABEL[o.status] ?? o.status, o.poRef ?? "", o.dispatchOn ?? "", o.note ?? "",
  ];
}

export function customerBookSheets(rows: Row[], legById: Record<string, RbLeg>, settings: RbSettings | null): Sheet[] {
  const customers: Sheet = {
    name: "Customers",
    rows: [
      ["Company", "Leg", "Contact", "Phone", "Address", "GST", "Payment terms", "Customer since",
        "Orders", "Total MT", "Last order", "Source folder"],
      ...rows.map(({ s, m }) => customerRow(s, m, legById)),
    ],
    widths: [34, 18, 18, 15, 44, 20, 18, 14, 8, 12, 12, 18],
    mt: [9],
  };

  const orderLines = rows.flatMap(({ s, m }) => ordersOf(m).map((o) => orderRow(o, s.name)));
  const orders: Sheet = {
    name: "Orders",
    rows: [
      ["Order no", "Date", "Company", "Grade", "MT", "Status", "PO ref", "Dispatched", "Note"],
      ...orderLines,
    ],
    widths: [15, 12, 34, 22, 10, 13, 14, 12, 40],
    mt: [4],
  };

  const totalMt = rows.reduce((a, r) => a + customerTotals(r.m).mt, 0);
  void settings; // the books carry no rupee figures, so the rate is not exported
  const summary: Sheet = {
    name: "Summary",
    rows: [
      ["Figure", "Value"],
      ["Customers", rows.length],
      ["Orders", orderLines.length],
      ["Total ordered (MT)", totalMt],
      ["Prepared on", stamp()],
    ],
    widths: [30, 22], mt: [1],
  };
  return [customers, orders, summary];
}

export function exportCustomerBookXlsx(rows: Row[], legById: Record<string, RbLeg>, settings: RbSettings | null): void {
  saveBlob(`whitedot-customer-book-${stamp()}.xlsx`, buildXlsx(customerBookSheets(rows, legById, settings)));
}

/** The same book as a document — what gets printed, signed or emailed. */
export function customerBookBlocks(rows: Row[], legById: Record<string, RbLeg>): Block[] {
  const totalMt = rows.reduce((a, r) => a + customerTotals(r.m).mt, 0);
  const orderCount = rows.reduce((a, r) => a + liveOrders(r.m).length, 0);

  const blocks: Block[] = [
    { t: "h1", text: "WhiteDot — LIMEX Customer Book" },
    { t: "small", text: `Prepared ${fmtDateLong(stamp())} · ${rows.length} customer${rows.length === 1 ? "" : "s"}` },
    {
      t: "kv",
      rows: [
        ["Customers", String(rows.length)],
        ["Orders", String(orderCount)],
        ["Total ordered", `${Number(totalMt.toFixed(3))} MT`],
      ],
    },
  ];

  for (const { s, m } of rows) {
    const t = customerTotals(m);
    const c = conOf(m);
    blocks.push({ t: "h2", text: s.name });
    blocks.push({
      t: "kv",
      rows: [
        ["Source folder", SOURCE_LABEL[sourceFolderOf(s,m)]],
        ["Leg", legName(legById, s.legId)],
        ["Contact", [c.n, phoneOf(s, m)].filter(Boolean).join(" · ") || "—"],
        ["Address", addrOf(s, m) || "—"],
        ["GST", m?.gstNumber || "—"],
        ["Payment terms", m?.paymentTerms || "—"],
        ["Customer since", m?.customerOn ? fmtDateLong(m.customerOn) : "—"],
        ["Ordered to date", `${Number(t.mt.toFixed(3))} MT across ${t.count} order${t.count === 1 ? "" : "s"}`],
      ],
    });
    const orders = ordersOf(m);
    if (orders.length) {
      blocks.push({
        t: "table",
        head: ["Order no", "Date", "Grade", "MT", "Status"],
        widths: [18, 14, 28, 12, 14],
        rows: orders.map((o) => [
          o.orderNo, fmtDateLong(o.orderedOn), o.grade,
          String(num(o.quantityMt) ?? ""), ORDER_STATUS_LABEL[o.status] ?? o.status,
        ]),
      });
    }
  }
  return blocks;
}

export function exportCustomerBookDocx(rows: Row[], legById: Record<string, RbLeg>): void {
  saveBlob(`whitedot-customer-book-${stamp()}.docx`, buildDocx(customerBookBlocks(rows, legById)));
}

/** One customer, one page — the sheet you hand across a table. */
export function exportCustomerStatement(s: RbStop, m: RbMark | undefined, leg: string): void {
  const blocks = customerBookBlocks([{ s, m }], { [s.legId]: { id: s.legId, name: leg } as RbLeg });
  blocks[0] = { t: "h1", text: `${s.name} — LIMEX account` };
  saveBlob(`${s.name.replace(/[^\w]+/g, "-").toLowerCase()}-statement-${stamp()}.docx`, buildDocx(blocks));
}

/** Trials still out, which is where a materials deal usually stalls. */
export function sampleSheet(rows: Row[]): Sheet {
  const lines: Cell[][] = rows.flatMap(({ s, m }) =>
    samplesOf(m).map((x) => [
      s.name, x.grade, num(x.kg), x.givenOn, x.trialDueOn ?? "",
      RESULT_LABEL[x.result] ?? x.result, x.resultOn ?? "", x.resultNote ?? "", x.contactName ?? "",
    ]));
  return {
    name: "Samples",
    rows: [["Company", "Grade", "kg", "Given on", "Trial due", "Result", "Result on", "Note", "Contact"], ...lines],
    widths: [34, 20, 9, 12, 12, 12, 12, 40, 18],
    money: [2],
  };
}
