import type { Row } from './logic.js';
import { PRODUCTS, matchesProduct, type ProductFilter } from './products.js';
export function ProductFilters({rows,value,onChange}: {rows: Row[];value:ProductFilter;onChange:(v:ProductFilter)=>void}) {
  return <section className="rb-products-filter" aria-label="Filter by product">
    <div><strong>What do they make?</strong><span>Choose a product to find the right companies.</span></div>
    <div className="rb-product-chips">
      <button type="button" aria-pressed={value==='all'} onClick={()=>onChange('all')}>All products <b>{rows.length}</b></button>
      {PRODUCTS.map(([id,label])=><button key={id} type="button" aria-pressed={value===id} onClick={()=>onChange(id)}>{label}<b>{rows.filter(r=>matchesProduct(r.s,r.m,id)).length}</b></button>)}
    </div>
  </section>;
}
