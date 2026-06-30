import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('public');
const outDir = path.resolve('paint-container-angles');
fs.mkdirSync(outDir, { recursive: true });

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
};

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent((req.url || '/').split('?')[0]);
  if (pathname === '/angle-preview.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <script type="module" src="/case-study/js/model-viewer.min.js"></script>
          <style>
            html, body { margin: 0; width: 100%; height: 100%; background: #f7f7f3; }
            model-viewer { width: 1200px; height: 1200px; background: transparent; }
          </style>
        </head>
        <body>
          <model-viewer
            id="viewer"
            src="/case-study/model/paint-container-procedural-red-white.glb"
            camera-target="0m 0.1m 0m"
            camera-orbit="0deg 72deg 8m"
            field-of-view="28deg"
            exposure="1.05"
            shadow-intensity="0.28"
            environment-image="neutral"
            reveal="auto">
          </model-viewer>
        </body>
      </html>`);
    return;
  }

  const filePath = path.normalize(path.join(root, pathname));
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});

await new Promise((resolveListen) => server.listen(4182, '127.0.0.1', resolveListen));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4182/angle-preview.html', { waitUntil: 'networkidle' });
await page.waitForFunction(() => {
  const viewer = document.querySelector('model-viewer');
  return viewer && viewer.loaded;
});

const angles = [
  ['front', '0deg 72deg 8m'],
  ['front-left', '-38deg 72deg 8m'],
  ['left', '-90deg 72deg 8m'],
  ['rear', '180deg 72deg 8m'],
  ['front-right', '38deg 72deg 8m'],
  ['top', '0deg 18deg 8.4m'],
  ['bottom', '0deg 128deg 8m'],
];

for (const [name, orbit] of angles) {
  await page.$eval('model-viewer', (viewer, nextOrbit) => {
    viewer.setAttribute('camera-orbit', nextOrbit);
  }, orbit);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
}

await browser.close();
server.close();

console.log(outDir);
