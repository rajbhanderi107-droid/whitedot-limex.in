// Draws a short vertical video for each case study, the product's real 3D
// model turning once: public/social/reels/<index>-<slug>.mp4 (1080x1920, 6 s,
// H.264 + silent AAC so Instagram Reels and Facebook accept it).
//
//   npm run social:reels            only the case studies with no video yet
//   npm run social:reels -- --all   redo every one
//   npm run social:reels -- bobbin  just the named slugs
//
// Same data and same rules as the still posts (scripts/render-social-posts.mjs):
// everything shown comes from products.json and specs.json, and the blend is
// always shown whole. Needs ffmpeg on the PATH.
// Set CHROME_PATH to use an installed Chrome instead of Playwright's download.
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const pub = resolve('public'), outDir = resolve(pub, 'social/reels');
const PHONE = ['+91', '98798 11180'];
const FPS = 24, SECONDS = 6, FRAMES = FPS * SECONDS, VIEW = 900, BOX = 660, STAGE_TOP = 560, STAGE = 780;
const json = (f) => JSON.parse(readFileSync(resolve(pub, 'case-study/data', f), 'utf8')).products;
const specs = json('specs.json');
const short = (s) => String(s || '').replace(/ ?Homo-Polymer/g, '').trim();
const posts = json('products.json')
  .filter((p) => p.status === 'live')
  .map((p) => {
    const f = specs[p.id] || {};
    const parts = short(f.mixRatio).split(/\s*\+\s*/).map((x) => {
      const m = /^(\d{1,3})%\s+(.+)$/.exec(x);
      if (!m) return null;
      const isLimex = /^LIMEX/i.test(m[2]);
      return { pct: Number(m[1]), label: isLimex ? 'LIMEX' : m[2].replace(/^balance$/i, 'Other materials'), grade: isLimex ? m[2].replace(/^LIMEX\s*/i, '') : '' };
    });
    const whole = parts.length >= 2 && parts.every(Boolean) && parts.reduce((t, x) => t + x.pct, 0) === 100;
    return /^\d{1,2}% LIMEX/.test(f.mixRatio || '') && whole && f.moulding && f.application
      ? { n: p.index, slug: p.slug, name: p.name, parts, proc: f.moulding, use: f.application }
      : null;
  })
  .filter(Boolean);

const args = process.argv.slice(2), all = args.includes('--all'), named = args.filter((a) => !a.startsWith('--'));
mkdirSync(outDir, { recursive: true });
const have = new Set(readdirSync(outDir));
const todo = posts.filter((p) => (named.length ? named.includes(p.slug) : all || !have.has(`${p.n}-${p.slug}.mp4`)));
console.log(`[social:reels] ${posts.length} case studies qualify, ${todo.length} to draw`);

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

/** One full turn of the product as transparent PNG frames in `dir`; returns the box that holds it in every frame. */
async function turn(slug, dir) {
  const pg = await b.newPage({ viewport: { width: VIEW, height: VIEW }, deviceScaleFactor: 1 });
  await pg.route(/googletagmanager|google-analytics|fonts\.g/, (r) => r.abort());
  await pg.goto(`${base}/case-study/product.html?p=${slug}`, { waitUntil: 'domcontentloaded' });
  const mv = pg.locator('model-viewer').first(); await mv.waitFor({ state: 'attached', timeout: 20000 });
  await mv.evaluate((el) => new Promise((d, f) => { el.removeAttribute('auto-rotate'); if (el.loaded) return d(); el.addEventListener('load', () => d(), { once: true }); setTimeout(() => f(new Error('timeout')), 60000); }));
  await pg.addStyleTag({ content: `html,body{background:transparent!important;animation:none!important;overflow:hidden!important}body *{visibility:hidden!important}model-viewer{visibility:visible!important;background:transparent!important;opacity:1!important;position:fixed!important;inset:0!important;width:${VIEW}px!important;height:${VIEW}px!important;z-index:99999}` });
  const start = await mv.evaluate(async (el) => {
    const [t, p] = (el.getAttribute('camera-orbit') || '0deg 76deg').split(/\s+/);
    el.setAttribute('max-camera-orbit', 'auto auto 400%'); el.setAttribute('interaction-prompt', 'none'); el.setAttribute('shadow-intensity', '0');
    el.setAttribute('camera-orbit', `${t} ${p} 150%`); await el.updateComplete; el.jumpCameraToGoal?.();
    return { t: parseFloat(t) || 0, p };
  });
  await pg.waitForTimeout(1500);
  let x0 = VIEW, y0 = VIEW, x1 = 0, y1 = 0;
  for (let i = 0; i < FRAMES; i++) {
    await mv.evaluate(async (el, o) => { el.setAttribute('camera-orbit', `${o.t}deg ${o.p} 150%`); await el.updateComplete; el.jumpCameraToGoal?.(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }, { t: start.t + (i * 360) / FRAMES, p: start.p });
    const png = await pg.screenshot({ omitBackground: true, type: 'png' });
    writeFileSync(join(dir, `${String(i).padStart(3, '0')}.png`), png);
    if (i % 2 === 0) {
      const { info } = await sharp(png).trim().toBuffer({ resolveWithObject: true });
      const l = -info.trimOffsetLeft, t = -info.trimOffsetTop;
      x0 = Math.min(x0, l); y0 = Math.min(y0, t); x1 = Math.max(x1, l + info.width); y1 = Math.max(y1, t + info.height);
    }
  }
  await pg.close();
  const pad = 12; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(VIEW, x1 + pad); y1 = Math.min(VIEW, y1 + pad);
  if (x1 - x0 < 40 || y1 - y0 < 40) throw new Error('model did not render');
  return { x: x0, y: y0, w: (x1 - x0) & ~1, h: (y1 - y0) & ~1 };
}

/** The still part of the frame: everything except the turning product. */
const backdrop = (p) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;font-family:Inter,sans-serif;position:relative;overflow:hidden;background:#f7f6f2;color:#2f3231}
.blob{position:absolute;border-radius:50%;background:#e9e7e1}
.top{position:absolute;top:150px;left:72px;right:72px;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:14px;font-size:30px;font-weight:600;letter-spacing:-.3px}.brand svg{width:54px;height:54px}
.auth{font-size:15px;letter-spacing:4px;font-weight:600;color:#6b706e;border-bottom:1px solid #b9bcb8;padding-bottom:8px}
h1{position:absolute;top:262px;left:72px;font-size:88px;line-height:1.02;font-weight:300;letter-spacing:-4px}h1 b{font-weight:700}
.rule{position:absolute;left:72px;top:474px;width:64px;height:3px;background:#2f3231}
.stage{position:absolute;left:${(1080 - STAGE) / 2}px;top:${STAGE_TOP}px;width:${STAGE}px;height:${STAGE}px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fbfaf8 0%,#e6e3dc 70%,#d9d6ce 100%)}
.name{position:absolute;left:72px;right:72px;top:1376px;font-size:46px;font-weight:600;letter-spacing:-1px}
.name small{display:block;font-size:16px;letter-spacing:4px;font-weight:600;color:#8a8f8c;margin-bottom:10px}
.mix{position:absolute;left:72px;right:72px;top:1486px;font-size:40px;font-weight:300;letter-spacing:-.5px;color:#2f3231}
.mix b{font-weight:700}.mix .l{color:#3f8f63}.mix i{font-style:normal;color:#a9aeab;margin:0 10px}
.bar{position:absolute;left:72px;right:72px;top:1556px;display:flex;height:10px;border-radius:999px;overflow:hidden;background:#dcdad4}
.bar div{height:100%}.bar .l{background:#3f8f63}.bar .o{background:#c4c7c2}
.cta{position:absolute;left:0;right:0;bottom:0;height:300px;background:#3a3d3c;color:#fff;padding:36px 72px 0;display:flex;justify-content:space-between;align-items:flex-start}
.cta small{display:block;font-size:20px;color:#c3c7c4;margin-bottom:6px}.cta .ph{font-size:50px;font-weight:300;letter-spacing:-1px}.cta .ph b{font-weight:600}
.mat{display:flex;align-items:center;gap:20px;margin-top:22px}.mat img{height:22px;filter:brightness(0) invert(1);opacity:.85}.mat img.l{height:26px}.mat span{font-size:14px;letter-spacing:3px;color:#aeb3b0}
</style></head><body>
<div class="blob" style="width:380px;height:380px;right:-220px;top:240px"></div><div class="blob" style="width:280px;height:280px;left:-140px;top:1240px;opacity:.7"></div>
<div class="top"><div class="brand">${logo}White Dot</div><div class="auth">AUTHORIZED LIMEX PARTNER</div></div>
<h1>Less plastic.<br><b>Same machine.</b></h1><div class="rule"></div>
<div class="stage"></div>
<div class="name"><small>CASE STUDY ${p.n} · ${p.proc.toUpperCase()}</small>${p.name}</div>
<div class="mix">${p.parts.map((x, k) => `${k ? '<i>+</i>' : ''}<b class="${x.label === 'LIMEX' ? 'l' : ''}">${x.pct}%</b> ${x.label}`).join('')}</div>
<div class="bar">${p.parts.map((x) => `<div class="${x.label === 'LIMEX' ? 'l' : 'o'}" style="width:${x.pct}%"></div>`).join('')}</div>
<div class="cta"><div><small>Samples and trial support · whitedotindia.in</small><div class="ph">${PHONE[0]} <b>${PHONE[1]}</b></div></div>
<div class="mat"><span>MATERIAL BY</span><img src="${tbm}"><img class="l" src="${limex}"></div></div>
</body></html>`;

const failed = [];
for (const p of todo) {
  const dir = mkdtempSync(join(tmpdir(), 'wd-reel-'));
  try {
    const box = await turn(p.slug, dir);
    const c = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    await c.setContent(backdrop(p), { waitUntil: 'load' }); await c.waitForTimeout(400);
    await c.screenshot({ type: 'png', path: join(dir, 'bg.png') }); await c.close();
    const cy = STAGE_TOP + STAGE / 2;
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-loop', '1', '-framerate', String(FPS), '-i', join(dir, 'bg.png'),
      '-framerate', String(FPS), '-i', join(dir, '%03d.png'), '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
      '-filter_complex', `[1:v]crop=${box.w}:${box.h}:${box.x}:${box.y},scale=${BOX}:${BOX}:force_original_aspect_ratio=decrease[p];[0:v][p]overlay=(W-w)/2:${cy}-h/2:shortest=1,format=yuv420p[v]`,
      '-map', '[v]', '-map', '2:a', '-t', String(SECONDS), '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart',
      resolve(outDir, `${p.n}-${p.slug}.mp4`)]);
    console.log('  ✓', p.n, p.slug);
  } catch (e) { failed.push(p.slug); console.warn('  ✗', p.slug, e.message); }
  finally { rmSync(dir, { recursive: true, force: true }); }
}
await b.close(); srv.close();
if (failed.length) { console.warn('[social:reels] not drawn:', failed.join(', ')); process.exitCode = 1; }
