import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('public');
const outDir = path.resolve('araldite-container-angles');
fs.mkdirSync(outDir, { recursive: true });

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent((req.url || '/').split('?')[0]);
  if (pathname === '/angle-preview.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html>
      <html><head><meta charset="utf-8">
      <script type="module" src="/case-study/js/model-viewer.min.js"></script>
      <style>html,body{margin:0;width:100%;height:100%;background:#f7f7f3;}
      model-viewer{width:1100px;height:1100px;background:transparent;}</style>
      </head><body>
      <model-viewer id="viewer"
        src="/case-study/model/araldite-container-procedural.glb"
        camera-target="0m -0.05m 0m" camera-orbit="0deg 78deg 7m"
        field-of-view="30deg" exposure="1.1" shadow-intensity="0.3"
        environment-image="neutral" reveal="auto"></model-viewer>
      </body></html>`);
    return;
  }
  const filePath = path.normalize(path.join(root, pathname));
  if (!filePath.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});

await new Promise((r) => server.listen(4183, '127.0.0.1', r));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 1100 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4183/angle-preview.html', { waitUntil: 'networkidle' });
await page.waitForFunction(() => { const v = document.querySelector('model-viewer'); return v && v.loaded; });

const angles = [
  ['front', '0deg 78deg 7m'],
  ['three-quarter', '35deg 74deg 7m'],
  ['side', '90deg 78deg 7m'],
  ['bottom', '0deg 150deg 7.4m'],
];
for (const [name, orbit] of angles) {
  await page.$eval('model-viewer', (v, o) => v.setAttribute('camera-orbit', o), orbit);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
}
await browser.close();
server.close();
console.log(outDir);
