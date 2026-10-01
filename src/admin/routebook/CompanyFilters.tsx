import { useEffect, useRef, useState, type Ref } from 'react';
import { Search, X, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';
import type { Row } from './logic.js';
import { PRODUCTS, productList, productFilterOf, type ProductFilter } from './products.js';
import { CANADA_PRODUCTS, useRegion } from './region.js';
import { SOURCE_LABEL, type FolderFilter } from './sources.js';

interface Props {
  rows: Row[]; product: ProductFilter; onProduct: (v: ProductFilter) => void;
  q: string; onSearch: (v: string) => void; searchRef?: Ref<HTMLInputElement>; searchTestId?: string;
  folder: FolderFilter; onFolder: (v: FolderFilter) => void;
  onReset: () => void; active: boolean; shown: number;
  /** What "of N" counts; defaults to every row. The Route Book passes its
   *  company count so removed and merged duplicates are not in the total. */
  total?: number;
  areas?: {id: string; name: string}[]; area?: string; onArea?: (v: string) => void;
  status: string; onStatus: (v: string) => void; statuses: readonly (readonly [string, string])[];
}

/** One line of controls: search, then a chip-like select per dimension. A
 *  select that is set turns sage, so what is filtering the list is visible at
 *  a glance; reset clears every dimension.
 *
 *  There is no "Manufacturer check" select. It filtered on whether a record
 *  carries a hand-entered product profile with evidence and a public source,
 *  which is true of 5 companies out of 2,052 — so as a filter it could only
 *  empty the book, and as a default it did. Verification is still recorded per
 *  company on the card; it is just not a way to search. Product is the one
 *  question this bar asks about what a company makes. */
export function CompanyFilters(p: Props) {
  const allStatus = p.statuses[0]?.[0] ?? 'all';
  const [region] = useRegion();
  const productChoices: readonly (readonly [string, string])[] = region === 'CA' ? CANADA_PRODUCTS : PRODUCTS;
  // On a phone the four selects fold behind one button, so the list starts
  // right under the search box. On a wider screen they are always shown.
  const [open, setOpen] = useState(false);
  const setCount = [p.product !== 'all', !!p.area, p.status !== allStatus, p.folder !== 'ALL'].filter(Boolean).length;
  return <section className={`rb-company-filters${open ? ' is-open' : ''}`} aria-label="Company filters" data-testid="company-filters">
    <div className="rb-find">
      <Search size={15} aria-hidden="true" />
      <input ref={p.searchRef} value={p.q} onChange={e => p.onSearch(e.target.value)} aria-label="Search companies"
        placeholder="Search company, product, address or phone" data-testid={p.searchTestId} />
      {p.q && <button type="button" aria-label="Clear search" onClick={() => p.onSearch('')}><X size={14} /></button>}
    </div>
    <button type="button" className="rb-ftoggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
      <SlidersHorizontal size={15} /> Filters{setCount ? <b>{setCount}</b> : null}
    </button>
    <div className="rb-fchips">
      <ProductPicker value={p.product} options={productChoices} onChange={p.onProduct} />
      {p.areas && <select aria-label="Area" className={p.area ? 'is-set' : ''} value={p.area} onChange={e => p.onArea?.(e.target.value)}>
        <option value="">All areas</option>{p.areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>}
      <select aria-label="Follow-up status" className={p.status !== allStatus ? 'is-set' : ''} value={p.status} onChange={e => p.onStatus(e.target.value)}>
        {p.statuses.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
      <select aria-label="Source" className={p.folder !== 'ALL' ? 'is-set' : ''} value={p.folder} onChange={e => p.onFolder(e.target.value as FolderFilter)}>
        <option value="ALL">All sources</option>{Object.entries(SOURCE_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
    </div>
    <div className="rb-filter-end">
      <span className="rb-showing" role="status" aria-live="polite">{p.shown} of {p.total ?? p.rows.length}</span>
      <button type="button" className="rb-reset" disabled={!p.active} onClick={p.onReset} data-testid="rb-clear"
        aria-label="Reset filters" title="Reset filters"><RotateCcw size={13} /> Reset</button>
    </div>
  </section>;
}

/** Product as a multi-select: tick any number; a company shows when it makes
 *  any of them. The button names what is chosen, and turns sage when set,
 *  like the other filters. It closes on a tap outside or Escape, and stays on
 *  a phone's screen. */
function ProductPicker({ value, options, onChange }: { value: ProductFilter; options: readonly (readonly [string, string])[]; onChange: (v: ProductFilter) => void }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const chosen = productList(value).filter((id) => options.some(([k]) => k === id));
  const label = !chosen.length ? 'All products'
    : chosen.length === 1 ? options.find(([k]) => k === chosen[0])![1]
    : `${chosen.length} products`;

  useEffect(() => {
    const d = ref.current;
    const panel = d?.querySelector<HTMLElement>('.rb-pick-panel');
    if (!d || !panel) return;
    panel.style.transform = '';
    if (!open) return;
    const gap = 8, vw = document.documentElement.clientWidth, r = panel.getBoundingClientRect();
    const shift = r.left < gap ? gap - r.left : r.right > vw - gap ? vw - gap - r.right : 0;
    if (shift) panel.style.transform = `translateX(${Math.round(shift)}px)`;
    const close = () => { d.open = false; };
    const onDown = (e: PointerEvent) => { if (!d.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggle = (id: string) => onChange(productFilterOf(chosen.includes(id as never) ? chosen.filter((x) => x !== id) : [...chosen, id as never]));

  return (
    <details ref={ref} className="rb-pick" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className={`rb-pick-btn${chosen.length ? ' is-set' : ''}`} aria-label={`Product: ${label}`} data-testid="product-picker">{label}</summary>
      <div className="rb-pick-panel" role="group" aria-label="Products">
        {options.map(([id, name]) => {
          const on = chosen.includes(id as never);
          return (
            <label key={id} className={`rb-pick-opt${on ? ' is-on' : ''}`}>
              <input type="checkbox" checked={on} onChange={() => toggle(id)} />
              <span className="rb-pick-box" aria-hidden="true">{on && <Check size={12} />}</span>
              {name}
            </label>
          );
        })}
        {chosen.length > 0 && <button type="button" className="rb-pick-clear" onClick={() => onChange('all')}>Show all products</button>}
      </div>
    </details>
  );
}
