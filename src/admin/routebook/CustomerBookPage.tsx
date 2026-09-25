import { areaOf, areaOptions } from "./areas.js";
import { CompanyFilters } from "./CompanyFilters.js";
import { ProductPanel } from "./ProductPanel.js";
import { matchesProduct, type ProductFilter } from "./products.js";
import { useSourceFolder } from "./SourceFolders.js";
import { sourceFolderOf, SOURCE_LABEL } from "./sources.js";
/* LIMEX Customer Book — who buys, how much, and on what terms.
 *
 * The final page of the same record: a customer is a Route Book company
 * whose `stage` is CUSTOMER. Orders are held in metric tonnes, and the whole
 * book exports to Excel and Word the way the weekly forms do. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck, FileSpreadsheet, FileText, Phone, MapPin, Plus, Trash2, Search, X,
  Handshake, PackageCheck, Truck, Undo2,
} from "lucide-react";
import type { RbOrder } from "./types.js";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "./types.js";
import type { Row } from "./logic.js";
import {
  addrOf, conOf, customerTotals, dueReorder, fmtDate, inr, inrFull, isCustomer, liveOrders, mt, num,
  ordersOf, phoneOf, telHref, today,
} from "./logic.js";
import { editOrder, patchMark, removeOrder, useRb } from "./store.js";
import { toast } from "./ctx.js";
import { BookShell, MoreMenu, Empty, Field, OpenAsApp, useBook } from "./BookBits.js";
import { exportCustomerBookDocx, exportCustomerBookXlsx, exportCustomerStatement } from "./exports.js";
import { OrderDialog } from "./OrderDialog.js";

const monthOf = (d: string) => d.slice(0, 7);

export function CustomerBookPage() {
  const st = useBook();
  const [area, setArea] = useState("");
  const [product, setProduct] = useState<ProductFilter>("all");
  const { folder, setFolder } = useSourceFolder();
  const rb = useRb();
  const [focus, setFocus] = useState("all");
  const [q, setQ] = useState("");
  const [ordering, setOrdering] = useState<Row | null>(null);

  const allSourceRows: Row[] = useMemo(() => st.stops.map((s) => ({ s, m: st.marks[s.id] })), [st.stops, st.marks]);
  const rows = useMemo(() => allSourceRows.filter(r => folder === "ALL" || sourceFolderOf(r.s, r.m) === folder), [allSourceRows, folder]);
  const customers = useMemo(
    () => rows.filter((r) => isCustomer(r.m) && !r.m?.removed)
      .sort((a, b) => (b.m?.customerOn ?? "").localeCompare(a.m?.customerOn ?? "")),
    [rows],
  );
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return customers.filter(({ s, m }) => (!area || areaOf({s,m}) === area) && matchesProduct(s,m,product) &&
      `${s.name} ${s.makes ?? ""} ${addrOf(s, m)} ${conOf(m).n ?? ""} ${phoneOf(s, m) ?? ""} ${m?.gstNumber ?? ""} ${ordersOf(m).map((o) => `${o.orderNo} ${o.grade}`).join(" ")}`
        .toLowerCase().includes(needle)
      && (focus === "all" || (focus === "reorder" ? dueReorder(m) : liveOrders(m).some((o) => o.status === focus))));
  }, [customers, q, focus, product, area]);

  const allOrders = customers.flatMap((r) => liveOrders(r.m));
  const totalMt = customers.reduce((a, r) => a + customerTotals(r.m).mt, 0);
  const priced = customers.map((r) => customerTotals(r.m).value).filter((v): v is number => v !== null);
  const thisMonth = allOrders.filter((o) => monthOf(o.orderedOn) === monthOf(today()));
  const monthMt = thisMonth.reduce((a, o) => a + (num(o.quantityMt) ?? 0), 0);

  const setStatus = (r: Row, o: RbOrder, status: RbOrder["status"]) => {
    void editOrder(r.s.id, o.id, { status }).catch((e: unknown) =>
      toast(e instanceof Error ? e.message : "Could not update the order", undefined, "err"));
  };
  /** Take a company back out of this book — the way out of a trial entry, or
   *  of a customer recorded by mistake. Their orders are the whole reason
   *  they are here, so those go too, and the confirm says so plainly. Nothing
   *  else is touched: the visit, the notes and the day record all stay, and
   *  the company lands back in the Lead Book. */
  const unmakeCustomer = (r: Row) => {
    const orders = ordersOf(r.m);
    const t = customerTotals(r.m);
    const warning = orders.length
      ? `This deletes ${orders.length} order${orders.length === 1 ? "" : "s"} (${mt(t.mt)}) and cannot be undone.`
      : "It has no orders recorded.";
    if (!window.confirm(`Take ${r.s.name} out of the Customer Book?\n\n${warning}\n\nThey go back to the Lead Book. Their visit, notes and day record are untouched.`)) return;
    void (async () => {
      try {
        for (const o of orders) await removeOrder(r.s.id, o.id);
        patchMark(r.s.id, { stage: "LEAD", customerOn: null });
        toast(`${r.s.name} moved back to the Lead Book`);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not remove that customer", undefined, "err");
      }
    })();
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
      title="Customers"
      sub={customers.length
        ? `${customers.length} customer${customers.length === 1 ? "" : "s"} · ${allOrders.length} order${allOrders.length === 1 ? "" : "s"} · ${mt(totalMt)} committed`
        : "Companies arrive here from the Lead Book the moment you record an order."}
      actions={
        <MoreMenu>
          <Link className="wd-ghost-btn" to="/admin/lead-book"><Handshake size={13} /> Leads</Link>
          <OpenAsApp dir="customers" label="Customer Book" />
          <button type="button" className="wd-ghost-btn" disabled={!customers.length}
            onClick={() => exportCustomerBookXlsx(customers, st.index.legById, st.settings)} data-testid="cb-xlsx">
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button type="button" className="wd-ghost-btn" disabled={!customers.length}
            onClick={() => exportCustomerBookDocx(customers, st.index.legById)} data-testid="cb-docx">
            <FileText size={13} /> Document
          </button>
        </MoreMenu>
      }
    >
      <CompanyFilters rows={customers} product={product} onProduct={setProduct} q={q} onSearch={setQ}
        searchTestId="cb-search" folder={folder} onFolder={setFolder} shown={shown.length}
        active={!!area || !!q || product !== "all" || folder !== "ALL" || focus !== "all"}
        onReset={() => {setArea("");setQ("");setProduct("all");setFolder("ALL");setFocus("all");}}
        areas={areaOptions(allSourceRows)} area={area} onArea={setArea} status={focus} onStatus={setFocus} statuses={[["all","All customers"],["CONFIRMED","Awaiting dispatch"],["DISPATCHED","Dispatched"],["DELIVERED","Delivered"],["PAID","Paid"],["reorder","Due a reorder"]]} />
      <section className="rb-dsec">
        <div className="rb-heroes">
          <div className="rb-hero"><b>{customers.length}</b><span>Customers</span></div>
          <div className="rb-hero"><b>{allOrders.length}</b><span>Orders</span></div>
          <div className="rb-hero"><b>{totalMt ? mt(totalMt) : "—"}</b><span>Total ordered</span></div>
          <div className="rb-hero"><b>{priced.length ? inr(priced.reduce((a, b) => a + b, 0)) : "—"}</b><span>Value to date</span></div>
          <div className="rb-hero"><b>{monthMt ? mt(monthMt) : "—"}</b><span>This month</span></div>
        </div>
      </section>



      {!customers.length && (
        <Empty
          title="No customers yet"
          hint="Open the Lead Book, pick the company that agreed, and choose “Won — record an order”. They will appear here with their tonnage."
        />
      )}

      {customers.length > 0 && !shown.length && <Empty title="No matching customers" hint="Try another name, phone or order number, or choose All customers." />}
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
                <h3>{r.s.name}</h3><span className="rb-source-label">{SOURCE_LABEL[sourceFolderOf(r.s,r.m)]}</span>
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
                <button type="button" className="wd-ghost-btn rb-rm" onClick={() => unmakeCustomer(r)}
                  title="Take this company out of the Customer Book" data-testid="cb-remove">
                  <Undo2 size={13} /> Not a customer
                </button>
              </div>
            </div>

            <ProductPanel s={r.s} m={r.m} />
            <details className="rb-secondary"><summary>Billing & delivery details</summary>
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

            </details>
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
                        <td data-label="Order" className="mono">{o.orderNo}{o.poRef ? <em> · PO {o.poRef}</em> : null}</td>
                        <td data-label="Date">{fmtDate(o.orderedOn)}</td>
                        <td data-label="Grade">{o.grade}</td>
                        <td data-label="MT" className="num">{num(o.quantityMt)}</td>
                        <td data-label="₹/kg" className="num">{num(o.rate) ?? "—"}</td>
                        <td data-label="Amount" className="num">{o.amount == null ? "—" : inrFull(num(o.amount))}</td>
                        <td data-label="Status">
                          <select value={o.status} onChange={(e) => setStatus(r, o, e.target.value as RbOrder["status"])} aria-label={`Status of ${o.orderNo}`}>
                            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
                          </select>
                        </td>
                        <td data-label="Actions">
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
