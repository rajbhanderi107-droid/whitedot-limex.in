/**
 * case-study-engine.js
 * Single source of truth: reads ./data/specs.json and populates the
 * current product detail page from data-wd-* attribute hooks.
 *
 * Usage in HTML:
 *   <body data-product="motorCover">   ← must match specs.json key
 *   <script src="./js/case-study-engine.js" defer></script>
 *
 * Hooks (add these attributes to existing elements):
 *   data-wd-html="description"        → innerHTML  = product.description
 *   data-wd-render="comp-bar"         → builds composition bar segments
 *   data-wd-render="comp-labels"      → builds LIMEX / PP percentage labels
 *   data-wd-render="comp-stats"       → builds 2-stat block with count-up
 *   data-wd-render="stats-grid"       → builds 3-box highlights grid
 *   data-wd-render="spec-grid"        → builds full spec table
 *   data-wd-render="nav-accent"       → sets nav accent bar text
 */
(async function wdProductEngine() {
  const productId = document.body.dataset.product;
  if (!productId) return;

  /* Bundled specs.json is always the baseline (has every product that ships
   * with the site). The live portal API is layered on top so edits made in
   * the portal show up immediately — but a product missing from the DB
   * (e.g. newly added straight to specs.json) still renders correctly
   * instead of vanishing because the API "won" and didn't know about it. */
  let products = {};
  try {
    const res = await fetch('./data/specs.json');
    ({ products } = await res.json());
  } catch (e) {
    console.warn('[WD Engine] Could not load specs.json', e);
  }

  const API = 'https://api.whitedotindia.in/api/public/case-studies';
  try {
    const apiRes = await fetch(API, { signal: AbortSignal.timeout(4000) });
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json.success && json.data?.products) {
        products = { ...products, ...json.data.products };
      }
    }
  } catch { /* network error or timeout — bundled specs.json still stands */ }

  const p = products[productId];
  if (!p) {
    console.warn('[WD Engine] No product found for id:', productId);
    return;
  }

  /* ── Description ─────────────────────────────────────────────────────────── */
  document.querySelectorAll('[data-wd-html="description"]').forEach(el => {
    el.innerHTML = p.description ?? '';
  });

  /* ── Composition bar ─────────────────────────────────────────────────────── */
  document.querySelectorAll('[data-wd-render="comp-bar"]').forEach(bar => {
    if (!p.composition) return;
    bar.innerHTML = p.composition.map(c =>
      `<div class="comp-seg" data-pct="${c.pct}"` +
      ` style="height:100%;width:0;` +
      `transition:width 1.6s cubic-bezier(0.16,1,0.3,1);` +
      `background:${c.color};background-size:200% auto;"></div>`
    ).join('');
  });

  /* ── Composition labels ──────────────────────────────────────────────────── */
  document.querySelectorAll('[data-wd-render="comp-labels"]').forEach(el => {
    if (!p.composition || !p.composition.length) return;
    const [a, b] = p.composition;
    const base = 'font-size:8.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;';
    el.innerHTML =
      `<span style="${base}color:var(--orange);">${a.pct}% ${a.name}</span>` +
      (b ? `<span style="${base}color:var(--wd-faint);">${b.pct}% ${b.name}</span>` : '');
  });

  /* ── Composition stats (2 stat numbers with count-up) ───────────────────── */
  document.querySelectorAll('[data-wd-render="comp-stats"]').forEach(el => {
    const hl = p.highlights;
    if (!hl || hl.length < 2) return;
    const [h0, h1] = hl;
    const parse = h => {
      const raw  = String(h.num);
      const pre  = raw.startsWith('~') ? '~' : '';
      const num  = parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
      const suf  = raw.replace(/[~0-9.]/g, '').trim();
      return { pre, num, suf };
    };
    const a = parse(h0), b = parse(h1);
    el.innerHTML =
      `<div class="comp-stat">` +
        `<span class="stat-num accent">${a.pre}<span class="num" data-to="${a.num}">0</span><small>${a.suf || '%'}</small></span>` +
        `<span class="stat-label">${h0.label}</span>` +
      `</div>` +
      `<div class="comp-stat">` +
        `<span class="stat-num">${b.pre}<span class="num" data-to="${b.num}">0</span><small>${b.suf || '%'}</small></span>` +
        `<span class="stat-label">${h1.label}</span>` +
      `</div>`;
  });

  /* ── Stats grid — 3 highlight boxes ─────────────────────────────────────── */
  document.querySelectorAll('[data-wd-render="stats-grid"]').forEach(el => {
    if (!p.highlights) return;
    el.innerHTML = p.highlights.slice(0, 3).map(h => {
      const unit = h.unit
        ? `<small style="font-size:10px;font-weight:500;margin-left:2px;">${h.unit}</small>`
        : '';
      return `<div class="glass-stat-box">` +
        `<span class="stat-box-num">${h.num}${unit}</span>` +
        `<span class="stat-box-label">${h.label}</span>` +
      `</div>`;
    }).join('');
  });

  /* ── Spec grid — full table from specs array ─────────────────────────────── */
  const ACCENT_LABELS = new Set([
    'Mixing Ratio',
    'Effective Limestone (CaCO3)',
    'Effective Limestone',
  ]);
  document.querySelectorAll('[data-wd-render="spec-grid"]').forEach(el => {
    if (!p.specs) return;
    el.innerHTML = p.specs.map(s => {
      const val = s.value + (s.unit ? ' ' + s.unit : '');
      const cls = ACCENT_LABELS.has(s.label) ? 'spec-val highlight' : 'spec-val';
      return `<div class="spec-item">` +
        `<span class="spec-label">${s.label}</span>` +
        `<span class="${cls}">${val}</span>` +
      `</div>`;
    }).join('');
  });

  /* ── Nav accent label ────────────────────────────────────────────────────── */
  document.querySelectorAll('[data-wd-render="nav-accent"]').forEach(el => {
    el.textContent =
      `Case Study ${p.index} — ${p.name} — ${p.mixRatio} — TBM LIMEX`;
  });

  /* ── Spec fill bar level (driven by first composition pct) ──────────────── */
  const fillRatio = (p.composition?.[0]?.pct ?? 50) / 100;
  document.querySelectorAll('.spec-fill-inner').forEach(el => {
    el.style.setProperty('--fill', String(fillRatio));
  });

  /* ── Verified data slot ──────────────────────────────────────────────────── */
  document.querySelectorAll('[data-tds-verified-slot]').forEach(el => {
    const allVerified = (p.specs ?? []).every(s => s.verified !== false);
    if (allVerified) {
      el.style.display = 'flex';
      el.innerHTML =
        '<span class="tds-verified-dot"></span>' +
        'Data sourced from White Dot case-study record &amp; TBM PE78-02M TDS';
    } else {
      el.style.display = 'none';
    }
  });

  /* ── Animations (comp bar width + count-up) ──────────────────────────────── */
  function countUp(el, target, dur) {
    const t0 = performance.now();
    (function step(now) {
      const t = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(target * t);
      if (t < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  /* Give the CSS transition a tick to register the initial width:0, then animate */
  setTimeout(() => {
    document.querySelectorAll('[data-wd-render="comp-bar"] .comp-seg[data-pct]').forEach(seg => {
      seg.style.width = (seg.dataset.pct || 0) + '%';
    });
    document.querySelectorAll('[data-wd-render="comp-stats"] .num[data-to]').forEach((n, i) => {
      const target = parseFloat(n.dataset.to);
      if (!isNaN(target)) setTimeout(() => countUp(n, target, 1100), i * 140);
    });
  }, 600);

})();
