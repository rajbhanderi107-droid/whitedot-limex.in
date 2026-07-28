import React, { useSyncExternalStore } from 'react';

/**
 * The product cards in CaseStudyFeature/CaseStudyPage are hand-written JSX, so
 * their composition bar and caption used to be hardcoded. Every card added from
 * product 19 onward was copied from the same template and shipped a full-width
 * green bar plus the literal "Material spec pending" — including products that
 * DO have a verified composition in specs.json. The standalone microsite reads
 * specs.json at runtime and showed the real ratio, so the two grids disagreed.
 *
 * This reads the same single source of truth and renders the cards 01–18
 * markup (split bar, "40% LIMEX · 60% PP"). The hardcoded caption stays as the
 * fallback: it is what renders before the fetch resolves, if the fetch fails,
 * or for products that genuinely have no composition yet.
 */

const basePath = window.location.hostname.endsWith('github.io') ? '/whitedot-limex.in' : '';

type Segment = { name: string; pct: number };
type RawSegment = { name?: string; pct?: number | null };

let comps: Record<string, Segment[]> | null = null;
let started = false;
const listeners = new Set<() => void>();

function load() {
  if (started) return;
  started = true;
  fetch(`${basePath}/case-study/data/specs.json`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((db) => {
      const next: Record<string, Segment[]> = {};
      Object.keys(db.products || {}).forEach((id) => {
        const raw: RawSegment[] = (db.products[id] && db.products[id].composition) || [];
        const segs = raw
          .filter((c) => typeof c.pct === 'number' && c.pct != null && c.name)
          .map((c) => ({ name: String(c.name), pct: Number(c.pct) }));
        if (segs.length) next[id] = segs;
      });
      comps = next;
      listeners.forEach((fn) => fn());
    })
    .catch(() => {
      // Keep the hardcoded fallbacks — never blank a card on a network blip.
      comps = {};
      listeners.forEach((fn) => fn());
    });
}

function subscribe(fn: () => void) {
  load();
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function getSnapshot() {
  return comps;
}

/**
 * `k` is the card's ProductKey. CaseStudyPage calls the dairy products
 * container `dairyContainer` while products.json/specs.json call it
 * `dairyProductsContainer`, so aliases bridge the two.
 */
const ALIASES: Record<string, string> = {
  dairyContainer: 'dairyProductsContainer',
};

function useComposition(k: string): Segment[] | null {
  const map = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!map) return null;
  return map[ALIASES[k] || k] || map[k] || null;
}

/** Renders the split ratio bar and its caption, matching cards 01–18. */
export function Composition({ k, children }: { k: string; children: React.ReactNode }) {
  const segs = useComposition(k);

  if (!segs) {
    return (
      <>
        <div className="csp-pbar">
          <span style={{ flex: 100, height: '100%', background: 'var(--cs-green)', display: 'block' }} />
        </div>
        <div className="csp-pbarlabels">
          <span className="csp-pdot pp" />
          <span className="csp-pblabel">{children}</span>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="csp-pbar">
        {segs.map((s, i) => (
          <span
            key={s.name}
            style={{
              flex: s.pct,
              height: '100%',
              background: i === 0 ? 'var(--cs-green)' : '#d0d3ce',
              display: 'block',
            }}
          />
        ))}
      </div>
      <div className="csp-pbarlabels">
        {segs.map((s, i) => (
          <React.Fragment key={s.name}>
            {i > 0 && <span className="csp-psep">·</span>}
            <span className={i === 0 ? 'csp-pdot pp' : 'csp-pdot lx'} />
            <span className="csp-pblabel">{s.pct}% {s.name.split(' ')[0]}</span>
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
