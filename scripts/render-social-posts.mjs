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
    return pct && f.moulding && f.application
      ? { n: p.index, slug: p.slug, name: p.name, pct: pct[1], blend: short(f.mixRatio), proc: f.moulding, use: f.application }
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
h1{position:absolute;top:168px;left:72px;font-size:88px;line-height:1.02;font-weight:300;letter-spacing:-3.5px;color:#2f3231}
h1 b{font-weight:700}
.rule{position:absolute;left:72px;top:392px;width:64px;height:3px;background:#2f3231}
.stage{position:absolute;right:28px;top:410px;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#ffffff 0%,#eceae4 70%,#e3e0d9 100%)}
.prod{position:absolute;right:28px;top:410px;width:560px;height:560px;display:flex;align-items:center;justify-content:center}
.prod img{max-width:430px;max-height:450px;filter:drop-shadow(0 30px 28px rgba(40,44,42,.22))}
.pct{position:absolute;left:72px;top:440px}
.pct b{display:block;font-size:210px;font-weight:200;letter-spacing:-10px;line-height:.86;color:#2f3231}
.pct b sup{font-size:92px;font-weight:300;letter-spacing:0;vertical-align:top;position:relative;top:22px;margin-left:6px;color:#4f9a6c}
.pct span{display:block;font-size:30px;font-weight:600;letter-spacing:9px;margin-top:22px;color:#2f3231}
.pct i{display:block;font-style:normal;font-size:27px;font-weight:400;color:#6b706e;margin-top:10px}
.pts{position:absolute;left:72px;top:772px;list-style:none}.pts li{font-size:25px;color:#3f4442;font-weight:400;margin-bottom:15px;padding-left:30px;position:relative}.pts li:before{content:"";position:absolute;left:0;top:13px;width:14px;height:2px;background:#4f9a6c}
.specs{position:absolute;left:72px;right:72px;top:1000px;display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:28px;border-top:1px solid #c9ccc7;padding-top:24px}
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
<div class="pct"><b class="d">${p.pct}<sup>%</sup></b><span>LIMEX</span><i>${p.name}</i></div>
<ul class="pts"><li>Runs on your existing machines</li><li>Technical data from TBM, Japan</li><li>Samples and trial support</li></ul>
<div class="specs"><div><small>BLEND</small><b>${p.blend}</b></div><div><small>PROCESS</small><b>${p.proc}</b></div><div><small>APPLICATION</small><b>${p.use}</b></div></div>
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
