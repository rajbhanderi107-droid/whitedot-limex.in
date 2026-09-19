import type { RbStop, RbMark } from './types.js';
import { VERIFIED_PRODUCTS } from './verifiedProducts.js';

export const PRODUCTS = [
  ['hm-bags', 'HM / HDPE bags'], ['plastic-bags', 'Plastic carry & garbage bags'],
  ['woven-bags', 'Woven bags & sacks'], ['nonwoven-bags', 'Non-woven bags'],
  ['toys', 'Plastic toys'], ['thinwall', 'Thin-wall containers'],
  ['dairy', 'Ice-cream & curd tubs'], ['bottles', 'Blow-moulded bottles'], ['jars', 'Plastic jars'],
] as const;
export type Product = typeof PRODUCTS[number][0];
export type ProductFilter = 'all' | Product;
export type ReviewFilter = 'verified' | 'review' | 'excluded' | 'all';
export interface ProductProfile {
  categories: Product[];
  business: 'manufacturer' | 'trader' | 'raw-material' | 'machinery' | 'unknown';
  opacity: 'opaque' | 'milky-white' | 'transparent' | 'unknown';
  evidence: string; source: string; checkedOn: string;
  photos: {url: string; caption: string; source: string}[];
}
export const blankProductProfile = (): ProductProfile => ({categories: [], business: 'unknown', opacity: 'unknown', evidence: '', source: '', checkedOn: '', photos: []});
export const safeProductUrl = (url: string): boolean => {
  try {const u = new URL(url); return u.protocol === 'https:' && !u.username && !u.password && !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[)/i.test(u.hostname);} catch {return false;}
};
export function productProfile(s: RbStop, m?: RbMark): ProductProfile | null {
  if (m?.productProfile) {
    try {
      const p = JSON.parse(m.productProfile);
      if (p && typeof p.evidence === "string" && typeof p.source === "string" && typeof p.checkedOn === "string" && Array.isArray(p.categories) && Array.isArray(p.photos)) return {...blankProductProfile(), ...p, categories:p.categories.filter((id: string)=>PRODUCTS.some(([k])=>k===id)), photos:p.photos.filter((v: {url:string})=>v && safeProductUrl(v.url))};
    } catch { /* Older or damaged profiles stay in review. */ }
  }
  return VERIFIED_PRODUCTS[s.id] ?? null;
}
/** Text labels help staff find entries to review. They never prove manufacturing. */
export function suggestedProducts(s: RbStop): Product[] {
  const t = `${s.makes ?? ''} ${(s.tags ?? []).map(t=>t.t).join(' ')}`.toLowerCase();
  const categories: Product[] = [];
  if (/\b(hm|hmhdpe|hm-hdpe)\b.*\b(bag|film|liner)|\bhdpe\b.*\b(carry|garbage|liner|shopping)\b/.test(t)) categories.push('hm-bags');
  if (/carry bags?|garbage bags?|courier bags?|plastic bags?|polythene bags?|t.shirt bags?|vest bags?/.test(t)) categories.push('plastic-bags');
  if (/non[ -]?woven/.test(t)) categories.push('nonwoven-bags');
  if (/(?<!non-)(?<!non )\bwoven\b.*\b(bag|sack|fibc)|\bfibc\b|jumbo bags?/.test(t.replace(/non[ -]?woven/g,''))) categories.push('woven-bags');
  if (/\btoys?\b/.test(t)) categories.push('toys');
  if (/thin[ -]?wall|takeaway containers?/.test(t)) categories.push('thinwall');
  if (/ice[ -]?cream|curd|dairy.*(tub|cup|container)|yog[hu]+rt.*(tub|cup|container)/.test(t)) categories.push('dairy');
  if (/bottles?/.test(t) && /hdpe|blow|milky|opaque/.test(t)) categories.push('bottles');
  if (/\bjars?\b/.test(t)) categories.push('jars');
  return categories;
}
export const categoriesOf = (s: RbStop, m?: RbMark) => productProfile(s,m)?.categories ?? suggestedProducts(s);
export function reviewState(s: RbStop, m?: RbMark): ReviewFilter {
  const p=productProfile(s,m);
  if(p) {
    if(['trader','raw-material','machinery'].includes(p.business) || p.opacity==='transparent') return 'excluded';
    if(p.business==='manufacturer' && ['opaque','milky-white'].includes(p.opacity) && p.categories.length && p.evidence.trim() && safeProductUrl(p.source)) return 'verified';
    return 'review';
  }
  if(['no','channel'].includes(s.fit)) return 'excluded';
  const t=`${s.makes ?? ''} ${s.src ?? ''}`.toLowerCase();
  if(/trader.wholesaler|granules? only|masterbatch|filler compound|moulds for|moulding machines|filling.*machines/.test(t) && !/also manufactur.*(bags|bottles|containers)/.test(t)) return 'excluded';
  return 'review';
}
export function matchesProduct(s: RbStop, m: RbMark|undefined, product: ProductFilter, review: ReviewFilter='all') {
  return (product==='all' || categoriesOf(s,m).includes(product)) && (review==='all' || reviewState(s,m)===review);
}
