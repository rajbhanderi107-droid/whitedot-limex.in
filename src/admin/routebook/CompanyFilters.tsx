import type { Ref } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Row } from './logic.js';
import { PRODUCTS, type ProductFilter, type ReviewFilter } from './products.js';
import { SOURCE_LABEL, type FolderFilter } from './sources.js';

interface Props {
  rows: Row[]; product: ProductFilter; onProduct: (v: ProductFilter) => void;
  q: string; onSearch: (v: string) => void; searchRef?: Ref<HTMLInputElement>; searchTestId?: string;
  folder: FolderFilter; onFolder: (v: FolderFilter) => void;
  onReset: () => void; active: boolean; shown: number;
  areas?: {id: string; name: string}[]; area?: string; onArea?: (v: string) => void;
  review?: ReviewFilter; onReview?: (v: ReviewFilter) => void;
  status: string; onStatus: (v: string) => void; statuses: readonly (readonly [string, string])[];
}

/** One visible set of controls. Each select is mutually exclusive; reset clears every dimension. */
export function CompanyFilters(p: Props) {
  return <section className="rb-company-filters" aria-label="Company filters" data-testid="company-filters">
    <div className="rb-filter-heading"><strong><SlidersHorizontal size={16} /> Find companies</strong>
      <span className="rb-showing" role="status" aria-live="polite">{p.shown} of {p.rows.length}</span>
      <button type="button" className="wd-ghost-btn" disabled={!p.active} onClick={p.onReset} data-testid="rb-clear">Reset filters</button>
    </div>
    <div className="rb-filter-grid">
      <label className="rb-filter-search">Search<div className="rb-find"><Search size={15}/>
        <input ref={p.searchRef} value={p.q} onChange={e=>p.onSearch(e.target.value)} aria-label="Search companies" placeholder="Company, product, address or phone" data-testid={p.searchTestId}/>
        {p.q && <button type="button" aria-label="Clear search" onClick={()=>p.onSearch('')}><X size={14}/></button>}
      </div></label>
      <label>Product<select aria-label="Product" value={p.product} onChange={e=>p.onProduct(e.target.value as ProductFilter)}>
        <option value="all">All products</option>{PRODUCTS.map(([id,label])=><option key={id} value={id}>{label}</option>)}
      </select></label>
      {p.areas && <label>Area<select aria-label="Area" value={p.area} onChange={e=>p.onArea?.(e.target.value)}>
        <option value="">All areas</option>{p.areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
      </select></label>}
      <label>Follow-up / status<select aria-label="Follow-up status" value={p.status} onChange={e=>p.onStatus(e.target.value)}>
        {p.statuses.map(([id,label])=><option key={id} value={id}>{label}</option>)}
      </select></label>
      {p.onReview && <label>Manufacturer check<select aria-label="Manufacturer check" value={p.review} onChange={e=>p.onReview?.(e.target.value as ReviewFilter)}>
        <option value="all">All records</option><option value="verified">Verified manufacturers</option><option value="review">Needs checking</option><option value="excluded">Outside target</option>
      </select></label>}
      <label>Source<select aria-label="Source" value={p.folder} onChange={e=>p.onFolder(e.target.value as FolderFilter)}>
        <option value="ALL">All sources</option>{Object.entries(SOURCE_LABEL).map(([id,label])=><option key={id} value={id}>{label}</option>)}
      </select></label>
    </div>
    {p.review === 'all' && <p className="rb-filter-note">Includes unchecked records. Choose Verified manufacturers for sourced opaque-product matches.</p>}
  </section>;
}
