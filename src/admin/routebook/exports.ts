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
  polymersOf, processesOf, quotedRateOf, RESULT_LABEL, samplesOf, today, tonnesOf, type Row,
} from "./logic.js";

const KG_PER_MT = 1000;
const stamp = () => today();
const legName = (legById: Record<string, RbLeg>, id: string) => legById[id]?.name ?? id;

/** What a lead is worth per month at the rate we quoted them. */
export function leadMonthlyValue(m: RbMark | undefined): number | null {
  const mt = expectedMtOf(m);
  const rate = quotedRateOf(m);
  return mt === null || rate === null ? null : mt * KG_PER_MT * rate;
}

/* ─── Lead Book ────────────────────────────────────────────────────────── */

export function leadBookSheet(rows: Row[], legById: Record<string, RbLeg>): Sheet {
  const head = [
    "Company", "Leg", "Contact", "Phone", "Lead since", "Next step",
    "Expected MT/month", "Quoted ₹/kg", "Value ₹/month",
    "Their volume (t/mo)", "Polymers", "Processes", "Samples out", "Follow-up due", "Note",
  ];
  const body: Cell[][] = rows.map(({ s, m }) => {
    const c = conOf(m);
    const open = samplesOf(m).filter((x) => x.result === "PENDING").length;
    return [
      s.name, legName(legById, s.legId), c.n, phoneOf(s, m), m?.leadOn ?? "", m?.nextStep ?? "",
      expectedMtOf(m), quotedRateOf(m), leadMonthlyValue(m),
      tonnesOf(m), polymersOf(m).join(", "), processesOf(m).join(", "),
      open || "", m?.dueOn ?? "", m?.note ?? "",
    ];
  });
  return {
    name: "Lead Book",
    rows: [head, ...body],
    widths: [34, 18, 18, 15, 12, 30, 17, 12, 15, 18, 16, 18, 12, 13, 44],
    mt: [6, 9], money: [7, 8],
  };
}

export function exportLeadBook(rows: Row[], legById: Record<string, RbLeg>): void {
  saveBlob(`whitedot-lead-book-${stamp()}.xlsx`, buildXlsx([leadBookSheet(rows, legById)]));
}

/* ─── Customer Book ────────────────────────────────────────────────────── */

function customerRow(s: RbStop, m: RbMark | undefined, legById: Record<string, RbLeg>): Cell[] {
  const t = customerTotals(m);
  const c = conOf(m);
  return [
    s.name, legName(legById, s.legId), c.n, phoneOf(s, m), addrOf(s, m),
    m?.gstNumber ?? "", m?.paymentTerms ?? "", m?.customerOn ?? "",
    t.count, t.mt, t.value, t.last ?? "",
  ];
}

function orderRow(o: RbOrder, company: string): Cell[] {
  return [
    o.orderNo, o.orderedOn, company, o.grade, num(o.quantityMt), num(o.rate), num(o.amount),
    ORDER_STATUS_LABEL[o.status] ?? o.status, o.poRef ?? "", o.dispatchOn ?? "", o.note ?? "",
  ];
}

export function customerBookSheets(rows: Row[], legById: Record<string, RbLeg>, settings: RbSettings | null): Sheet[] {
  const customers: Sheet = {
    name: "Customers",
    rows: [
      ["Company", "Leg", "Contact", "Phone", "Address", "GST", "Payment terms", "Customer since",
        "Orders", "Total MT", "Total value ₹", "Last order"],
      ...rows.map(({ s, m }) => customerRow(s, m, legById)),
    ],
    widths: [34, 18, 18, 15, 44, 20, 18, 14, 8, 12, 16, 12],
    mt: [9], money: [10],
  };

  const orderLines = rows.flatMap(({ s, m }) => ordersOf(m).map((o) => orderRow(o, s.name)));
  const orders: Sheet = {
    name: "Orders",
    rows: [
      ["Order no", "Date", "Company", "Grade", "MT", "Rate ₹/kg", "Amount ₹", "Status", "PO ref", "Dispatched", "Note"],
      ...orderLines,
    ],
    widths: [15, 12, 34, 22, 10, 11, 15, 13, 14, 12, 40],
    mt: [4], money: [5, 6],
  };

  const totalMt = rows.reduce((a, r) => a + customerTotals(r.m).mt, 0);
  const priced = rows.map((r) => customerTotals(r.m).value).filter((v): v is number => v !== null);
  const summary: Sheet = {
    name: "Summary",
    rows: [
      ["Figure", "Value"],
      ["Customers", rows.length],
      ["Orders", orderLines.length],
      ["Total ordered (MT)", totalMt],
      ["Total value (₹)", priced.length ? priced.reduce((a, b) => a + b, 0) : ""],
      ["Your LIMEX rate (₹/kg)", num(settings?.limexRate) ?? ""],
      ["Prepared on", stamp()],
    ],
    widths: [30, 22], mt: [1], money: [1],
  };
  return [customers, orders, summary];
}

export function exportCustomerBookXlsx(rows: Row[], legById: Record<string, RbLeg>, settings: RbSettings | null): void {
  saveBlob(`whitedot-customer-book-${stamp()}.xlsx`, buildXlsx(customerBookSheets(rows, legById, settings)));
}

/** The same book as a document — what gets printed, signed or emailed. */
export function customerBookBlocks(rows: Row[], legById: Record<string, RbLeg>): Block[] {
  const totalMt = rows.reduce((a, r) => a + customerTotals(r.m).mt, 0);
  const priced = rows.map((r) => customerTotals(r.m).value).filter((v): v is number => v !== null);
  const orderCount = rows.reduce((a, r) => a + liveOrders(r.m).length, 0);
  const money = (v: number | null) =>
    v === null ? "—" : `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const blocks: Block[] = [
    { t: "h1", text: "WhiteDot — LIMEX Customer Book" },
    { t: "small", text: `Prepared ${fmtDateLong(stamp())} · ${rows.length} customer${rows.length === 1 ? "" : "s"}` },
    {
      t: "kv",
      rows: [
        ["Customers", String(rows.length)],
        ["Orders", String(orderCount)],
        ["Total ordered", `${Number(totalMt.toFixed(3))} MT`],
        ["Total value", priced.length ? money(priced.reduce((a, b) => a + b, 0)) : "not priced"],
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
        ["Leg", legName(legById, s.legId)],
        ["Contact", [c.n, phoneOf(s, m)].filter(Boolean).join(" · ") || "—"],
        ["Address", addrOf(s, m) || "—"],
        ["GST", m?.gstNumber || "—"],
        ["Payment terms", m?.paymentTerms || "—"],
        ["Customer since", m?.customerOn ? fmtDateLong(m.customerOn) : "—"],
        ["Ordered to date", `${Number(t.mt.toFixed(3))} MT across ${t.count} order${t.count === 1 ? "" : "s"}`],
        ["Value to date", money(t.value)],
      ],
    });
    const orders = ordersOf(m);
    if (orders.length) {
      blocks.push({
        t: "table",
        head: ["Order no", "Date", "Grade", "MT", "Rate ₹/kg", "Amount", "Status"],
        widths: [16, 12, 22, 10, 12, 16, 12],
        rows: orders.map((o) => [
          o.orderNo, fmtDateLong(o.orderedOn), o.grade,
          String(num(o.quantityMt) ?? ""), num(o.rate) === null ? "—" : String(num(o.rate)),
          money(num(o.amount)), ORDER_STATUS_LABEL[o.status] ?? o.status,
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
