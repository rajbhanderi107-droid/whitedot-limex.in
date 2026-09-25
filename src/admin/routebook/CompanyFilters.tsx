import { useState, type Ref } from 'react';
import { Search, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { Row } from './logic.js';
import { PRODUCTS, type ProductFilter } from './products.js';
import { CANADA_PRODUCTS, useRegion } from './region.js';
import { SOURCE_LABEL, type FolderFilter } from './sources.js';

interface Props {
  rows: Row[]; product: ProductFilter; onProduct: (v: ProductFilter) => void;
  q: string; onSearch: (v: string) => void; searchRef?: Ref<HTMLInputElement>; searchTestId?: string;
  folder: FolderFilter; onFolder: (v: FolderFilter) => void;
  onReset: () => void; active: boolean; shown: number;
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
  const productList: readonly (readonly [string, string])[] = region === 'CA' ? CANADA_PRODUCTS : PRODUCTS;
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
      <select aria-label="Product" className={p.product !== 'all' ? 'is-set' : ''} value={p.product}
        onChange={e => p.onProduct(e.target.value as ProductFilter)}>
        <option value="all">All products</option>{productList.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
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
      <span className="rb-showing" role="status" aria-live="polite">{p.shown} of {p.rows.length}</span>
      <button type="button" className="rb-reset" disabled={!p.active} onClick={p.onReset} data-testid="rb-clear"
        aria-label="Reset filters" title="Reset filters"><RotateCcw size={13} /> Reset</button>
    </div>
  </section>;
}
