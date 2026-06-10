import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--window-size=1440,900'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto('http://127.0.0.1:5173/?wd_preview=1', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));
const pinTop = await p.evaluate(() => {
  const el = document.getElementById('material');
  return el ? el.getBoundingClientRect().top + window.scrollY : 0;
});
console.log('pinTop', pinTop);
for (let i = 0; i < 8; i++) {
  const y = Math.round(pinTop + i * 900 - (i > 0 ? 250 : 0));
  await p.evaluate(yy => window.scrollTo(0, yy), y);
  await new Promise(r => setTimeout(r, 2200));
  const st = await p.evaluate(() => {
    const ops = [...document.querySelectorAll('.v2story__scene')].map(s => +getComputedStyle(s).opacity);
    const visible = ops.lastIndexOf(1);
    return { scrollY: window.scrollY, visible, ops: ops.map(o => o.toFixed(1)).join(',') };
  });
  console.log(`i=${i} target=${y} ->`, JSON.stringify(st));
}
await b.close();
