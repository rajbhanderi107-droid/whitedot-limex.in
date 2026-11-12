// Draws the weekly social post image for each case study:
// public/social/<index>-<slug>.jpg (1080x1350, JPEG so Instagram accepts it).
//
//   npm run social:render            only the case studies with no image yet
//   npm run social:render -- --all   redo every one
//   npm run social:render -- bobbin  just the named slugs
//
// Everything on the card comes from products.json and specs.json. A case study
// is skipped when its blend has no stated LIMEX percentage, because the card's
// headline number would have nothing verified to show.
// Set CHROME_PATH to use an installed Chrome instead of Playwright's download.
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const pub = resolve('public'), outDir = resolve(pub, 'social');
const PHONE = ['+91', '98798 11180'];
const json = (f) => JSON.parse(readFileSync(resolve(pub, 'case-study/data', f), 'utf8')).products;
const specs = json('specs.json');
const short = (s) => String(s || '').replace(/ ?Homo-Polymer/g, '').trim();
export const posts = json('products.json')
  .filter((p) => p.status === 'live')
  .map((p) => {
    const f = specs[p.id] || {};
    const pct = /^(\d{1,2})% LIMEX/.exec(f.mixRatio || '');
    // "40% LIMEX PE78-02M + 60% PP" -> [{pct:40,label:'LIMEX',grade:'PE78-02M'},{pct:60,label:'PP',grade:''}]
    const parts = short(f.mixRatio).split(/\s*\+\s*/).map((x) => {
      const m = /^(\d{1,3})%\s+(.+)$/.exec(x);
      if (!m) return null;
      const isLimex = /^LIMEX/i.test(m[2]);
      const label = isLimex ? 'LIMEX' : m[2].replace(/^balance$/i, 'Other materials');
      return { pct: Number(m[1]), label, grade: isLimex ? m[2].replace(/^LIMEX\s*/i, '') : '' };
    });
    const whole = parts.length >= 2 && parts.every(Boolean) && parts.reduce((t, x) => t + x.pct, 0) === 100;
    return pct && whole && f.moulding && f.application
      ? { n: p.index, slug: p.slug, name: p.name, parts, proc: f.moulding, use: f.application }
      : null;
  })
  .filter(Boolean);

const args = process.argv.slice(2), all = args.includes('--all'), named = args.filter((a) => !a.startsWith('--'));
mkdirSync(outDir, { recursive: true });
const have = new Set(readdirSync(outDir));
const todo = posts.filter((p) => (named.length ? named.includes(p.slug) : all || !have.has(`${p.n}-${p.slug}.jpg`)));
console.log(`[social:render] ${posts.length} case studies qualify, ${todo.length} to draw`);

const T = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const srv = createServer((q, r) => {
  const p = resolve(pub, '.' + decodeURIComponent(new URL(q.url, 'http://x').pathname));
  let body = null;
  if (p.startsWith(pub + sep)) { try { body = readFileSync(p); } catch { body = null; } }
  if (!body) return r.writeHead(404).end();
  r.writeHead(200, { 'content-type': T[extname(p)] || 'application/octet-stream' }); r.end(body);
});
await new Promise((d) => srv.listen(0, '127.0.0.1', d));
const base = `http://127.0.0.1:${srv.address().port}`;
const uri = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64');
const logo = readFileSync(resolve(pub, 'assets/whitedot-logo-enhanced.svg'), 'utf8').replace(/<\?xml[^>]*>/, '');
const tbm = uri(resolve(pub, 'assets/tbm-logo.png')), limex = uri(resolve(pub, 'assets/limex-wordmark.png'));
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

/** The product's 3D model as a transparent PNG, taken from its real case-study page. */
async function shotOf(slug) {
    const pg = await b.newPage({ viewport: { width: 1400, height: 1400 }, deviceScaleFactor: 2 });
  await pg.route(/googletagmanager|google-analytics|fonts\.g/, r => r.abort());
  await pg.goto(`${base}/case-study/product.html?p=${slug}`, { waitUntil: 'domcontentloaded' });
  const mv = pg.locator('model-viewer').first(); await mv.waitFor({ state: 'attached', timeout: 20000 });
  await mv.evaluate(el => new Promise((d, f) => { el.removeAttribute('auto-rotate'); if (el.loaded) return d(); el.addEventListener('load', () => d(), { once: true }); setTimeout(() => f(new Error('timeout')), 60000); }));
  await pg.addStyleTag({ content: `html,body{background:transparent!important;animation:none!important}body *{visibility:hidden!important}model-viewer{visibility:visible!important;background:transparent!important;opacity:1!important}` });
  await mv.evaluate(async el => { const [t, p] = (el.getAttribute('camera-orbit') || '0deg 76deg').split(/\s+/); el.setAttribute('max-camera-orbit', 'auto auto 400%'); el.setAttribute('camera-orbit', `${t} ${p} 150%`); el.setAttribute('shadow-intensity', '0'); await el.updateComplete; el.jumpCameraToGoal?.(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
  await pg.waitForTimeout(1500);
  const box = await mv.evaluate(el => { el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, 1400 - Math.max(0, r.x)), height: Math.min(r.height, 1400 - Math.max(0, r.y)) }; });
  const s = await sharp(await pg.screenshot({ omitBackground: true, type: 'png', clip: box })).trim().png().toBuffer(); await pg.close(); return s;
}

// The four "Why LIMEX" facts. Each is a claim the site already makes
// (src/god-wd/god-wd-data.ts, LimexDetail.tsx), in the same qualified wording.
const ic = (d) => `<svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="16" fill="none" stroke="#3f8f63" stroke-width="1.5"/><path d="${d}" fill="none" stroke="#3f8f63" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const facts = (p) => [
  [ic('M10 22l4-8 4 5 3-4 3 7z'), 'Limestone-based', 'Calcium carbonate compound developed by TBM, Japan'],
  [ic('M10 17h14M19 12l5 5-5 5'), 'Uses your existing line', `Processes like plastic once blended${p.parts.some((x) => x.label === 'PP') ? ' with PP' : ''}`],
  [ic('M11 23V17M17 23V11M23 23v-9'), 'Up to 80% loading', 'In selected grades, confirmed by trial'],
  [ic('M11 17.5l4 4 8-9'), 'Backed by data', 'TBM-authorized data to support EPR claims'],
];
const failed = [];
for (const p of todo) {
  try {
    const img = 'data:image/png;base64,' + (await shotOf(p.slug)).toString('base64');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1350px;font-family:Inter,sans-serif;position:relative;overflow:hidden;background:#f7f6f2;color:#2f3231}
.d{font-family:"Inter Display",Inter}
.blob{position:absolute;border-radius:50%;background:#e9e7e1}
.top{position:absolute;top:60px;left:72px;right:72px;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:14px;font-size:28px;font-weight:600;letter-spacing:-.3px;color:#2f3231}.brand svg{width:50px;height:50px}
.auth{font-size:15px;letter-spacing:4px;font-weight:600;color:#6b706e;border-bottom:1px solid #b9bcb8;padding-bottom:8px}
h1{position:absolute;top:150px;left:72px;font-size:78px;line-height:1.02;font-weight:300;letter-spacing:-3.5px;color:#2f3231}
h1 b{font-weight:700}
.rule{position:absolute;left:72px;top:338px;width:64px;height:3px;background:#2f3231}
.stage{position:absolute;right:40px;top:372px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#ffffff 0%,#eceae4 70%,#e3e0d9 100%)}
.prod{position:absolute;right:40px;top:372px;width:400px;height:400px;display:flex;align-items:center;justify-content:center}
.prod img{max-width:320px;max-height:330px;filter:drop-shadow(0 30px 28px rgba(40,44,42,.22))}
.name{position:absolute;left:72px;top:372px;font-size:38px;font-weight:600;letter-spacing:-.8px;color:#2f3231}
.name small{display:block;font-size:14px;letter-spacing:4px;font-weight:600;color:#8a8f8c;margin-bottom:10px}
.blend{position:absolute;left:72px;top:488px;width:500px}
.blend .lab{font-size:14px;letter-spacing:4px;font-weight:600;color:#8a8f8c;margin-bottom:14px}
.mix{display:flex;align-items:flex-start;gap:18px}
.part b{display:block;font-size:124px;font-weight:300;letter-spacing:-5px;line-height:.9;color:#2f3231}
.part b sup{font-size:50px;font-weight:400;letter-spacing:0;vertical-align:top;position:relative;top:10px;margin-left:3px}
.part.l b,.part.l b sup{color:#3f8f63}
.part.o b{color:#7d8380}
.part span{display:block;font-size:22px;font-weight:700;letter-spacing:3px;white-space:nowrap;margin-top:14px;color:#2f3231}
.part i{display:block;font-style:normal;font-size:18px;color:#6b706e;margin-top:5px;letter-spacing:.3px}
.plus{font-size:60px;font-weight:200;color:#a9aeab;margin-top:22px}
.bar{display:flex;height:10px;border-radius:999px;overflow:hidden;margin-top:26px;background:#dcdad4}
.bar div{height:100%}.bar .l{background:#3f8f63}.bar .o{background:#c4c7c2}
.why{position:absolute;left:72px;right:72px;top:800px}
.why .lab{font-size:14px;letter-spacing:4px;font-weight:600;color:#8a8f8c;margin-bottom:16px}
.facts{display:grid;grid-template-columns:1fr 1fr;gap:16px 40px}
.fact{display:flex;gap:16px;align-items:flex-start}
.fact svg{flex:none;width:34px;height:34px;margin-top:2px}
.fact b{display:block;font-size:22px;font-weight:600;color:#2f3231;letter-spacing:-.2px}
.fact span{display:block;font-size:18.5px;color:#5f6562;margin-top:3px;line-height:1.3}
.specs{position:absolute;left:72px;right:72px;top:1004px;display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:28px;border-top:1px solid #c9ccc7;padding-top:24px}
.specs small{display:block;font-size:14px;letter-spacing:3.5px;color:#8a8f8c;font-weight:600;margin-bottom:8px}.specs b{font-size:22px;font-weight:500;color:#2f3231;line-height:1.3}
.cta{position:absolute;left:0;right:0;bottom:0;height:216px;background:#3a3d3c;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 72px}
.cta small{display:block;font-size:20px;color:#c3c7c4;margin-bottom:8px;letter-spacing:.3px}.cta .ph{font-size:50px;font-weight:300;letter-spacing:-1px}.cta .ph b{font-weight:600}
.btn{border:1.5px solid #fff;font-weight:500;font-size:23px;padding:17px 30px;border-radius:999px;letter-spacing:.3px}
.r{text-align:right}.mat{display:flex;align-items:center;gap:22px;justify-content:flex-end;margin-top:22px}.mat img{height:22px;filter:brightness(0) invert(1);opacity:.85}.mat img.l{height:26px}.mat span{font-size:14px;letter-spacing:3px;color:#aeb3b0}
</style></head><body>
<div class="blob" style="width:360px;height:360px;right:-210px;top:150px"></div><div class="blob" style="width:260px;height:260px;left:-120px;top:860px;opacity:.7"></div>
<div class="top"><div class="brand">${logo}White Dot</div><div class="auth">AUTHORIZED LIMEX PARTNER</div></div>
<h1 class="d">Less plastic.<br><b>Same machine.</b></h1><div class="rule"></div>
<div class="stage"></div><div class="prod"><img src="${img}"></div>
<div class="name"><small>CASE STUDY ${p.n}</small>${p.name}</div>
<div class="blend"><div class="lab">MATERIAL BLEND</div>
<div class="mix">${p.parts.map((x, k) => `${k ? '<div class="plus">+</div>' : ''}<div class="part ${x.label === 'LIMEX' ? 'l' : 'o'}"><b class="d">${x.pct}<sup>%</sup></b><span>${x.label}</span>${x.label === 'LIMEX' ? '<i>Limestone compound</i>' : x.label === 'PP' ? '<i>Polypropylene</i>' : ''}</div>`).join('')}</div>
<div class="bar">${p.parts.map((x) => `<div class="${x.label === 'LIMEX' ? 'l' : 'o'}" style="width:${x.pct}%"></div>`).join('')}</div></div>
<div class="why"><div class="lab">WHY LIMEX</div><div class="facts">${facts(p).map((f) => `<div class="fact">${f[0]}<div><b>${f[1]}</b><span>${f[2]}</span></div></div>`).join('')}</div></div>
<div class="specs"><div><small>PROCESS</small><b>${p.proc}</b></div><div><small>APPLICATION</small><b>${p.use}</b></div><div><small>${p.parts[0].grade ? 'LIMEX GRADE' : 'MATERIAL'}</small><b>${p.parts[0].grade || 'LIMEX compound'}</b></div></div>
<div class="cta"><div><small>Samples and trial support · whitedotindia.in</small><div class="ph d">${PHONE[0]} <b>${PHONE[1]}</b></div></div>
<div class="r"><span class="btn">Request a sample</span><div class="mat"><span>MATERIAL BY</span><img src="${tbm}"><img class="l" src="${limex}"></div></div></div>
</body></html>`;
    const c = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    await c.setContent(html, { waitUntil: 'load' }); await c.waitForTimeout(400);
    const png = await c.screenshot({ type: 'png' }); await c.close();
    writeFileSync(resolve(outDir, `${p.n}-${p.slug}.jpg`), await sharp(png).jpeg({ quality: 90, mozjpeg: true }).toBuffer());
    console.log('  ✓', p.n, p.slug);
  } catch (e) { failed.push(p.slug); console.warn('  ✗', p.slug, e.message); }
}
await b.close(); srv.close();
if (failed.length) { console.warn('[social:render] not drawn:', failed.join(', ')); process.exitCode = 1; }
