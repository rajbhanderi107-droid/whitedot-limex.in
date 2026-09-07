/* LIMEX Customer Book — who buys, how much, and on what terms.
 *
 * The final page of the same record: a customer is a Route Book company
 * whose `stage` is CUSTOMER. Orders are held in metric tonnes, and the whole
 * book exports to Excel and Word the way the weekly forms do. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck, FileSpreadsheet, FileText, Phone, MapPin, Plus, Trash2, Search, X,
  Handshake, PackageCheck, Truck,
} from "lucide-react";
import type { RbOrder } from "./types.js";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "./types.js";
import type { Row } from "./logic.js";
import {
  addrOf, conOf, customerTotals, fmtDate, inr, inrFull, isCustomer, liveOrders, mt, num,
  ordersOf, phoneOf, telHref, today,
} from "./logic.js";
import { editOrder, patchMark, removeOrder, useRb } from "./store.js";
import { toast } from "./ctx.js";
import { BookShell, Empty, Field, useBook } from "./BookBits.js";
import { exportCustomerBookDocx, exportCustomerBookXlsx, exportCustomerStatement } from "./exports.js";
import { OrderDialog } from "./OrderDialog.js";

const monthOf = (d: string) => d.slice(0, 7);

export function CustomerBookPage() {
  const st = useBook();
  const rb = useRb();
  const [q, setQ] = useState("");
  const [ordering, setOrdering] = useState<Row | null>(null);

  const rows: Row[] = useMemo(() => st.stops.map((s) => ({ s, m: st.marks[s.id] })), [st.stops, st.marks]);
  const customers = useMemo(
    () => rows.filter((r) => isCustomer(r.m))
      .sort((a, b) => (b.m?.customerOn ?? "").localeCompare(a.m?.customerOn ?? "")),
    [rows],
  );
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter(({ s, m }) =>
      `${s.name} ${addrOf(s, m)} ${m?.gstNumber ?? ""} ${ordersOf(m).map((o) => o.orderNo + o.grade).join(" ")}`
        .toLowerCase().includes(needle));
  }, [customers, q]);

  const allOrders = customers.flatMap((r) => liveOrders(r.m));
  const totalMt = customers.reduce((a, r) => a + customerTotals(r.m).mt, 0);
  const priced = customers.map((r) => customerTotals(r.m).value).filter((v): v is number => v !== null);
  const thisMonth = allOrders.filter((o) => monthOf(o.orderedOn) === monthOf(today()));
  const monthMt = thisMonth.reduce((a, o) => a + (num(o.quantityMt) ?? 0), 0);

  const setStatus = (r: Row, o: RbOrder, status: RbOrder["status"]) => {
    void editOrder(r.s.id, o.id, { status }).catch((e: unknown) =>
      toast(e instanceof Error ? e.message : "Could not update the order", undefined, "err"));
  };
  const drop = (r: Row, o: RbOrder) => {
    if (!window.confirm(`Delete order ${o.orderNo} (${mt(num(o.quantityMt))} of ${o.grade})? This cannot be undone.`)) return;
    void removeOrder(r.s.id, o.id)
      .then(() => toast(`${o.orderNo} deleted`))
      .catch((e: unknown) => toast(e instanceof Error ? e.message : "Could not delete the order", undefined, "err"));
  };

  return (
    <BookShell
      st={st}
      testId="customer-book"
      icon={<BadgeCheck size={20} />}
      title="LIMEX Customer Book"
      sub={customers.length
        ? `${customers.length} customer${customers.length === 1 ? "" : "s"} · ${allOrders.length} order${allOrders.length === 1 ? "" : "s"} · ${mt(totalMt)} committed`
        : "Companies arrive here from the Lead Book the moment you record an order."}
      actions={
        <>
          <Link className="wd-ghost-btn" to="/admin/lead-book"><Handshake size={13} /> Lead Book</Link>
          <button type="button" className="wd-ghost-btn" disabled={!customers.length}
            onClick={() => exportCustomerBookXlsx(customers, st.index.legById, st.settings)} data-testid="cb-xlsx">
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button type="button" className="wd-ghost-btn" disabled={!customers.length}
            onClick={() => exportCustomerBookDocx(customers, st.index.legById)} data-testid="cb-docx">
            <FileText size={13} /> Document
          </button>
        </>
      }
    >
      <section className="rb-dsec">
        <div className="rb-dhead">
          <h3>The book at a glance</h3>
          <span className="rb-dcount">rupee figures appear only where a rate was agreed</span>
        </div>
        <div className="rb-heroes">
          <div className="rb-hero"><b>{customers.length}</b><span>Customers</span></div>
          <div className="rb-hero"><b>{allOrders.length}</b><span>Orders</span></div>
          <div className="rb-hero"><b>{totalMt ? mt(totalMt) : "—"}</b><span>Total ordered</span></div>
          <div className="rb-hero"><b>{priced.length ? inr(priced.reduce((a, b) => a + b, 0)) : "—"}</b><span>Value to date</span></div>
          <div className="rb-hero"><b>{monthMt ? mt(monthMt) : "—"}</b><span>This month</span></div>
        </div>
      </section>

      {customers.length > 0 && (
        <div className="rb-toolbar">
          <div className="rb-find">
            <Search size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers, GST, order numbers…" data-testid="cb-search" />
            {q && <button type="button" onClick={() => setQ("")} aria-label="Clear search"><X size={13} /></button>}
          </div>
          <span className="rb-showing">{shown.length} of {customers.length}</span>
        </div>
      )}

      {!customers.length && (
        <Empty
          title="No customers yet"
          hint="Open the Lead Book, pick the company that agreed, and choose “Won — record an order”. They will appear here with their tonnage."
        />
      )}

      {shown.map((r) => {
        const t = customerTotals(r.m);
        const c = conOf(r.m);
        const phone = phoneOf(r.s, r.m);
        const orders = ordersOf(r.m);
        const set = (patch: Parameters<typeof patchMark>[1]) => patchMark(r.s.id, patch);
        return (
          <section key={r.s.id} className="rb-bcard" data-testid="cb-card">
            <div className="rb-bcard-head">
              <div>
                <h3>{r.s.name}</h3>
                <p>
                  {r.m?.customerOn ? `Customer since ${fmtDate(r.m.customerOn)}` : "Customer"}
                  {" · "}{mt(t.mt)} across {t.count} order{t.count === 1 ? "" : "s"}
                  {t.value !== null ? ` · ${inr(t.value)}` : ""}
                  {c.n ? ` · ${c.n}` : ""}
                </p>
              </div>
              <div className="rb-bacts">
                {phone && <a className="wd-ghost-btn" href={telHref(phone)}><Phone size={13} /> Call</a>}
                <Link className="wd-ghost-btn" to={`/admin/route-book?s=${encodeURIComponent(r.s.id)}`}><MapPin size={13} /> In the book</Link>
                <button type="button" className="wd-ghost-btn"
                  onClick={() => exportCustomerStatement(r.s, r.m, st.index.legById[r.s.legId]?.name ?? r.s.legId)}>
                  <FileText size={13} /> Statement
                </button>
                <button type="button" className="wd-primary-btn" onClick={() => setOrdering(r)} data-testid="cb-addorder">
                  <Plus size={13} /> Order
                </button>
              </div>
            </div>

            <div className="rb-bgrid">
              <Field label="GST number" value={r.m?.gstNumber} placeholder="24XXXXX0000X1Z5"
                onSave={(v) => set({ gstNumber: v || null })} />
              <Field label="Payment terms" value={r.m?.paymentTerms} placeholder="30 days from invoice"
                onSave={(v) => set({ paymentTerms: v || null })} />
              <Field label="Bill to" value={r.m?.billTo} wide placeholder="Registered billing address"
                onSave={(v) => set({ billTo: v || null })} />
              <Field label="Ship to" value={r.m?.shipTo} wide placeholder="Plant / delivery address"
                onSave={(v) => set({ shipTo: v || null })} />
            </div>

            {orders.length === 0 ? (
              <p className="rb-bnote">No orders recorded yet.</p>
            ) : (
              <div className="rb-otable-wrap">
                <table className="rb-otable">
                  <thead>
                    <tr>
                      <th>Order</th><th>Date</th><th>Grade</th><th className="num">MT</th>
                      <th className="num">₹/kg</th><th className="num">Amount</th><th>Status</th><th />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className={o.status === "CANCELLED" ? "is-void" : ""}>
                        <td className="mono">{o.orderNo}{o.poRef ? <em> · PO {o.poRef}</em> : null}</td>
                        <td>{fmtDate(o.orderedOn)}</td>
                        <td>{o.grade}</td>
                        <td className="num">{num(o.quantityMt)}</td>
                        <td className="num">{num(o.rate) ?? "—"}</td>
                        <td className="num">{o.amount == null ? "—" : inrFull(num(o.amount))}</td>
                        <td>
                          <select value={o.status} onChange={(e) => setStatus(r, o, e.target.value as RbOrder["status"])} aria-label={`Status of ${o.orderNo}`}>
                            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
                          </select>
                        </td>
                        <td>
                          <button type="button" className="wd-ghost-btn" onClick={() => drop(r, o)} aria-label={`Delete ${o.orderNo}`}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="rb-bstats">
              <span><PackageCheck size={12} /> {t.count} live order{t.count === 1 ? "" : "s"}</span>
              <span><Truck size={12} /> {t.last ? `Last ordered ${fmtDate(t.last)}` : "Nothing ordered yet"}</span>
            </div>
          </section>
        );
      })}

      {ordering && (
        <OrderDialog
          row={ordering}
          settings={rb.settings}
          onClose={() => setOrdering(null)}
          onDone={(order) => {
            setOrdering(null);
            toast(`${order.orderNo} recorded · ${mt(num(order.quantityMt))}`);
          }}
        />
      )}
    </BookShell>
  );
}
