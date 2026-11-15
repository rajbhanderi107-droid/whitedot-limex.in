// Draws a short vertical story video for each case study:
// public/social/reels/<index>-<slug>.mp4 (1080x1920, about 12 s, H.264 + silent
// AAC so Instagram Reels and Facebook accept it). Five scenes cross-fade: the
// question, the product (its real 3D model, turning), the blend, the process,
// and how to ask for a sample.
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
const FPS = 24, SECONDS = 6, FRAMES = FPS * SECONDS, VIEW = 1400, BOX = 660, STAGE_TOP = 560, STAGE = 780;
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
  await pg.addStyleTag({ content: `html,body{background:transparent!important;animation:none!important}body *{visibility:hidden!important}model-viewer{visibility:visible!important;background:transparent!important;opacity:1!important}` });
  const start = await mv.evaluate(async (el) => {
    const [t, p] = (el.getAttribute('camera-orbit') || '0deg 76deg').split(/\s+/);
    el.setAttribute('max-camera-orbit', 'auto auto 400%'); el.setAttribute('interaction-prompt', 'none'); el.setAttribute('shadow-intensity', '0');
    el.setAttribute('camera-orbit', `${t} ${p} 150%`); await el.updateComplete; el.jumpCameraToGoal?.();
    return { t: parseFloat(t) || 0, p };
  });
  await pg.waitForTimeout(1500);
  const clip = await mv.evaluate((el, V) => { el.scrollIntoView({ block: 'center', inline: 'center' }); const r = el.getBoundingClientRect(); const x = Math.max(0, r.x), y = Math.max(0, r.y); return { x, y, width: Math.floor(Math.min(r.width, V - x)), height: Math.floor(Math.min(r.height, V - y)) }; }, VIEW);
  if (clip.width < 50 || clip.height < 50) throw new Error('3D viewer has no size on the page');
  let x0 = VIEW, y0 = VIEW, x1 = 0, y1 = 0;
  for (let i = 0; i < FRAMES; i++) {
    await mv.evaluate(async (el, o) => { el.setAttribute('camera-orbit', `${o.t}deg ${o.p} 150%`); await el.updateComplete; el.jumpCameraToGoal?.(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }, { t: start.t + (i * 360) / FRAMES, p: start.p });
    const png = await pg.screenshot({ omitBackground: true, type: 'png', clip });
    writeFileSync(join(dir, `${String(i).padStart(3, '0')}.png`), png);
    if (i % 2 === 0) {
      const { info } = await sharp(png).trim().toBuffer({ resolveWithObject: true });
      const l = -info.trimOffsetLeft, t = -info.trimOffsetTop;
      x0 = Math.min(x0, l); y0 = Math.min(y0, t); x1 = Math.max(x1, l + info.width); y1 = Math.max(y1, t + info.height);
    }
  }
  await pg.close();
  const pad = 12; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(clip.width, x1 + pad); y1 = Math.min(clip.height, y1 + pad);
  if (x1 - x0 < 40 || y1 - y0 < 40) throw new Error('model did not render');
  return { x: x0, y: y0, w: (x1 - x0) & ~1, h: (y1 - y0) & ~1 };
}

const CSS = `*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;font-family:Inter,sans-serif;position:relative;overflow:hidden;background:#f7f6f2;color:#2f3231}
body.dark{background:#3a3d3c;color:#fff}
.blob{position:absolute;border-radius:50%;background:#e9e7e1}
.top{position:absolute;top:150px;left:72px;right:72px;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:14px;font-size:30px;font-weight:600;letter-spacing:-.3px}.brand svg{width:54px;height:54px}
.auth{font-size:15px;letter-spacing:4px;font-weight:600;color:#6b706e;border-bottom:1px solid #b9bcb8;padding-bottom:8px}
.dark .auth{color:#c3c7c4;border-color:#6b706e}
.stage{position:absolute;left:${(1080 - STAGE) / 2}px;top:${STAGE_TOP}px;width:${STAGE}px;height:${STAGE}px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fbfaf8 0%,#e6e3dc 70%,#d9d6ce 100%)}
.step{position:absolute;left:72px;top:296px;font-size:16px;letter-spacing:4px;font-weight:600;color:#8a8f8c}
.cap{position:absolute;left:72px;right:72px;top:1384px}
.cap small{display:block;font-size:17px;letter-spacing:4px;font-weight:600;color:#8a8f8c;margin-bottom:14px}
.cap h2{font-size:64px;line-height:1.05;font-weight:300;letter-spacing:-2.5px}.cap h2 b{font-weight:700}.cap h2 .l{color:#3f8f63;font-weight:700}.cap h2 i{font-style:normal;color:#a9aeab;margin:0 6px}
.cap p{font-size:30px;line-height:1.3;color:#5f6562;margin-top:16px}
.bar{display:flex;height:12px;border-radius:999px;overflow:hidden;background:#dcdad4;margin-top:26px}
.bar div{height:100%}.bar .l{background:#3f8f63}.bar .o{background:#c4c7c2}
.big{position:absolute;left:72px;right:72px;top:620px;font-size:112px;line-height:1.02;font-weight:300;letter-spacing:-5px}.big b{font-weight:700;display:block;margin-top:36px}
.rule{position:absolute;left:72px;top:560px;width:64px;height:3px;background:currentColor}
.end{position:absolute;left:72px;right:72px;top:980px;letter-spacing:0}
.end small{display:block;font-size:30px;color:#c3c7c4}.end .ph{font-size:92px;font-weight:300;letter-spacing:-3px;margin-top:10px;white-space:nowrap}.end .ph b{font-weight:600}
.end .web{font-size:38px;font-weight:500;margin-top:26px}
.mat{position:absolute;left:72px;bottom:400px;display:flex;align-items:center;gap:22px}.mat img{height:28px;filter:brightness(0) invert(1);opacity:.85}.mat img.l{height:32px}.mat span{font-size:15px;letter-spacing:3px;color:#aeb3b0}`;
const page = (cls, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body class="${cls}">
<div class="top"><div class="brand">${logo}White Dot</div><div class="auth">AUTHORIZED LIMEX PARTNER</div></div>${body}</body></html>`;
const blobs = '<div class="blob" style="width:380px;height:380px;right:-220px;top:240px"></div><div class="blob" style="width:280px;height:280px;left:-140px;top:1240px;opacity:.7"></div>';
const withProduct = (n, cap) => page('', `${blobs}<div class="step">CASE STUDY ${n}</div><div class="stage"></div><div class="cap">${cap}</div>`);

/** The five scenes, in order: [seconds on screen, html]. The product is laid over scenes 2-4. */
const scenes = (p) => [
  [2.7, page('', `${blobs}<div class="rule"></div><div class="big">Most of a plastic part is polymer.<b>It does not have to be.</b></div>`)],
  [3.2, withProduct(p.n, `<small>THE PRODUCT</small><h2><b>${p.name}</b></h2><p>${p.use}</p>`)],
  [3.2, withProduct(p.n, `<small>THE BLEND</small><h2>${p.parts.map((x, k) => `${k ? '<i>+</i>' : ''}<span class="${x.label === 'LIMEX' ? 'l' : ''}"><b>${x.pct}%</b></span> ${x.label}`).join('')}</h2>
<div class="bar">${p.parts.map((x) => `<div class="${x.label === 'LIMEX' ? 'l' : 'o'}" style="width:${x.pct}%"></div>`).join('')}</div><p>LIMEX is a limestone-based compound developed by TBM, Japan</p>`)],
  [2.4, withProduct(p.n, `<small>THE PROCESS</small><h2>Less plastic. <b>Same machine.</b></h2><p>${p.proc}, on a standard line once blended</p>`)],
  [2.5, page('dark', `<div class="rule"></div><div class="big">Request<b>a sample.</b></div><div class="end"><small>Samples and trial support</small><div class="ph">${PHONE[0]} <b>${PHONE[1]}</b></div><div class="web">whitedotindia.in</div></div>
<div class="mat"><span>MATERIAL BY</span><img src="${tbm}"><img class="l" src="${limex}"></div>`)],
];
const FADE = 0.4;

const failed = [];
for (const p of todo) {
  const dir = mkdtempSync(join(tmpdir(), 'wd-reel-'));
  try {
    const box = await turn(p.slug, dir);
    const sc = scenes(p), c = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    for (const [k, [, html]] of sc.entries()) { await c.setContent(html, { waitUntil: 'load' }); await c.waitForTimeout(250); await c.screenshot({ type: 'png', path: join(dir, `s${k}.png`) }); }
    await c.close();
    // Cross-fade the scene stills, then lay the turning product over scenes 2-4.
    const inputs = sc.flatMap(([d], k) => ['-loop', '1', '-framerate', String(FPS), '-t', String(d), '-i', join(dir, `s${k}.png`)]);
    let at = 0, chain = '', last = '[0:v]';
    const starts = [0];
    for (let k = 1; k < sc.length; k++) {
      at += sc[k - 1][0] - FADE; starts.push(at);
      chain += `${last}[${k}:v]xfade=transition=fade:duration=${FADE}:offset=${at.toFixed(2)}[x${k}];`; last = `[x${k}]`;
    }
    const total = at + sc[sc.length - 1][0], show = starts[1], hide = starts[4];
    const cy = STAGE_TOP + STAGE / 2, P = sc.length;
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs,
      '-stream_loop', '-1', '-framerate', String(FPS), '-i', join(dir, '%03d.png'), '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
      '-filter_complex', `${chain}[${P}:v]crop=${box.w}:${box.h}:${box.x}:${box.y},scale=${BOX}:${BOX}:force_original_aspect_ratio=decrease,format=rgba,fade=in:st=${show.toFixed(2)}:d=${FADE}:alpha=1,fade=out:st=${hide.toFixed(2)}:d=${FADE}:alpha=1[p];${last}[p]overlay=(W-w)/2:${cy}-h/2:enable='between(t,${show.toFixed(2)},${(hide + FADE).toFixed(2)})',format=yuv420p[v]`,
      '-map', '[v]', '-map', `${P + 1}:a`, '-t', total.toFixed(2), '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart',
      resolve(outDir, `${p.n}-${p.slug}.mp4`)]);
    console.log('  ✓', p.n, p.slug);
  } catch (e) { failed.push(p.slug); console.warn('  ✗', p.slug, e.message); }
  finally { rmSync(dir, { recursive: true, force: true }); }
}
await b.close(); srv.close();
if (failed.length) { console.warn('[social:reels] not drawn:', failed.join(', ')); process.exitCode = 1; }
