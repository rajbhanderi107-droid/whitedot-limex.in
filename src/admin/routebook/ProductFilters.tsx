import type { Row } from './logic.js';
import { PRODUCTS, matchesProduct, type ProductFilter } from './products.js';

/** Pick a product to narrow the book; pick it again to come back to all of it.
 *
 *  There is no "All products" button any more. A chip that means "no filter"
 *  sitting in a row of chips that mean "this filter" reads as a fifth product,
 *  and it left no way to tell a deliberate choice from the opening state. Now
 *  nothing pressed is the opening state, and every chip releases on a second
 *  tap — the same rule as every other control in the book. */
export function ProductFilters({rows,value,onChange}: {rows: Row[];value:ProductFilter;onChange:(v:ProductFilter)=>void}) {
  return <section className="rb-products-filter" aria-label="Filter by product">
    <div><strong>What do they make?</strong><span>{value === 'all'
      ? `All ${rows.length} companies. Choose a product to narrow them.`
      : 'Tap the same product again to show every company.'}</span></div>
    <div className="rb-product-chips">
      {PRODUCTS.map(([id,label])=>{
        const n = rows.filter(r=>matchesProduct(r.s,r.m,id)).length;
        if (!n && value !== id) return null;   // a chip that finds nothing is not offered
        return <button key={id} type="button" aria-pressed={value===id} data-testid={`rb-product-${id}`}
          onClick={()=>onChange(value===id ? 'all' : id)}>{label}<b>{n}</b></button>;
      })}
    </div>
  </section>;
}
