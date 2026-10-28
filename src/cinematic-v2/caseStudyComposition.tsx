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

export type Brief = { grade: string; pct: number | null; blend: string };
type RawProduct = {
  referenceGrade?: string;
  composition?: RawSegment[];
  limexPct?: number;
  blendWith?: string;
};

let comps: Record<string, Segment[]> | null = null;
let briefs: Record<string, Brief> = {};
let started = false;
const listeners = new Set<() => void>();

function load() {
  if (started) return;
  started = true;
  fetch(`${basePath}/case-study/data/specs.json`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((db) => {
      const next: Record<string, Segment[]> = {};
      const nextBriefs: Record<string, Brief> = {};
      Object.keys(db.products || {}).forEach((id) => {
        const raw: RawSegment[] = (db.products[id] && db.products[id].composition) || [];
        const segs = raw
          .filter((c) => typeof c.pct === 'number' && c.pct != null && c.name)
          .map((c) => ({ name: String(c.name), pct: Number(c.pct) }));
        if (segs.length) next[id] = segs;
        const b = deriveBrief(db.products[id] || {});
        if (b) nextBriefs[id] = b;
      });
      briefs = nextBriefs;
      comps = next;
      listeners.forEach((fn) => fn());
    })
    .catch(() => {
      // Keep the hardcoded fallbacks — never blank a card on a network blip.
      comps = {};
      listeners.forEach((fn) => fn());
    });
}

/**
 * The only technical detail the case studies publish: LIMEX grade, what it is
 * blended with, and how much LIMEX is used. Mirrors materialBrief() in
 * public/case-study/product.html — keep the two in step.
 */
export function deriveBrief(p: RawProduct): Brief | null {
  const segs = (p.composition || []).filter((c) => c && c.name);
  const limex = segs.find((c) => /limex/i.test(String(c.name))) || null;
  const rawGrade = String(p.referenceGrade || '').trim();
  const grade = /per lot|review|^$/i.test(rawGrade) ? '' : rawGrade;
  const pct = typeof p.limexPct === 'number' ? p.limexPct : limex && typeof limex.pct === 'number' ? limex.pct : null;
  const blend = p.blendWith || segs.filter((c) => c !== limex).map((c) => String(c.name)).join(' + ');
  if (!grade && pct == null && !blend) return null;
  return { grade, pct, blend };
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

type Stat = { value: React.ReactNode; label: string; green?: boolean };

/**
 * Hero stats strip for the hovered card: keeps the hand-written first cell
 * (index + name) and replaces the rest with grade / LIMEX % / blend from
 * specs.json, so no card can surface trial weights or batch records.
 */
export function useBriefStats(k: string, fallback: Stat[]): Stat[] {
  const map = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!map || k === 'overview') return fallback;
  const b = briefs[ALIASES[k] || k] || briefs[k];
  if (!b) return fallback;
  const out: Stat[] = [fallback[0]];
  if (b.grade) out.push({ value: b.grade, label: 'LIMEX Grade', green: true });
  if (b.pct != null) out.push({ value: `${b.pct}%`, label: 'LIMEX Used' });
  if (b.blend) out.push({ value: b.blend.replace(/\s*Homo-Polymer/i, ''), label: 'Blended With' });
  return out;
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
