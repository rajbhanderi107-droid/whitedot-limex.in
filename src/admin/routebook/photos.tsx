/* Photos of a company, one tap from any book, India or Canada.
 *
 * Only the companies whose products were checked by hand carry photos of
 * their own (ProductPanel). For the other few thousand there is nothing
 * stored, so the Photos button opens an image search for the company's name
 * and town — the quickest way to see the plant and what it makes before a
 * call or a visit. Where checked photos exist, a strip of them sits on the
 * company card as well. */

import { Images } from "lucide-react";
import type { RbMark, RbStop } from "./types.js";
import { productProfile } from "./products.js";

/** The town from an address: the last comma part, less its postcode,
 *  province or state ("…, Scarborough, ON M1V 2V4" → "Scarborough",
 *  "…, Vatva GIDC, Ahmedabad 382445" → "Ahmedabad"). */
export function townOf(addr: string): string {
  const parts = addr.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
  const clean = (p: string) => p
    .replace(/\s*[-–—]\s*(?:street|plot|address) to confirm.*$/i, "")
    .replace(/\b(?:ON|QC|BC|AB|MB|SK|NS|NB|NL|PE)\b\s*[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/gi, "")
    .replace(/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/gi, "")
    .replace(/\b(?:ON|QC|BC|AB|MB|SK|NS|NB|NL|PE)\b$/i, "")
    .replace(/\b(?:Gujarat|India|Canada|Ontario|Quebec|Québec)\b/gi, "")
    .replace(/\d{6}/g, "").replace(/·.*$/, "")
    .replace(/\s+/g, " ").trim();
  for (let i = parts.length - 1; i >= 0; i--) {
    const t = clean(parts[i]);
    if (t && !/^\d+$/.test(t) && !/^(?:plot|unit|suite|survey)\b/i.test(t)) return t;
  }
  return "";
}

export function photoSearchUrl(s: RbStop, m?: RbMark): string {
  const addr = m?.addrOverride || s.addr || "";
  const q = [s.name, townOf(addr)].filter(Boolean).join(" ");
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
}

/** The Photos button: an image search for this company, in a new tab. */
export function PhotosLink({ s, m, className }: { s: RbStop; m?: RbMark; className?: string }) {
  return (
    <a className={className} href={photoSearchUrl(s, m)} target="_blank" rel="noopener noreferrer"
      title={`See photos of ${s.name}`} data-testid="rb-photos">
      <Images size={12} /> Photos
    </a>
  );
}

/** Checked product photos, as a thumbnail strip. Nothing when there are none. */
export function PhotoStrip({ s, m }: { s: RbStop; m?: RbMark }) {
  const photos = productProfile(s, m)?.photos ?? [];
  if (!photos.length) return null;
  return (
    <div className="rb-photo-strip" data-testid="rb-photo-strip">
      {photos.slice(0, 6).map((p) => (
        <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer" title={p.caption || s.name}>
          <img src={p.url} alt={p.caption || `${s.name} product`} loading="lazy" referrerPolicy="no-referrer" />
        </a>
      ))}
    </div>
  );
}
