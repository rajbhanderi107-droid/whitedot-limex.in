import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--window-size=1440,900'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto('http://127.0.0.1:5173/?wd_preview=1', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 2500));
const st = await p.evaluate(() => {
  const t = document.querySelector('.wds3-limex');
  const out = [];
  // baseline
  out.push(['as-is', t.getBoundingClientRect().width]);
  t.style.letterSpacing = 'normal';
  out.push(['ls-normal', t.getBoundingClientRect().width]);
  t.style.fontWeight = '400';
  out.push(['fw-400', t.getBoundingClientRect().width]);
  t.style.fontFamily = 'Arial';
  out.push(['arial', t.getBoundingClientRect().width]);
  // compare with a working label
  const lbl = document.querySelector('.wds3-label');
  out.push(['label-w', lbl.getBoundingClientRect().width, lbl.textContent]);
  return out;
});
console.log(JSON.stringify(st));
await b.close();
