import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--window-size=1440,900'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto('https://whitedotindia.in/?wd_preview=1', { waitUntil: 'networkidle2', timeout: 45000 });
await new Promise(r => setTimeout(r, 3000));
const pinTop = await p.evaluate(() => {
  const el = document.getElementById('material');
  return el ? el.getBoundingClientRect().top + window.scrollY : 0;
});
await p.evaluate(y => window.scrollTo(0, y), Math.round(pinTop + 2 * 900 - 250));
await new Promise(r => setTimeout(r, 4500));
await p.screenshot({ path: 'C:/Users/rbhan/AppData/Local/Temp/wd-shots/live-s3.png' });
await p.evaluate(y => window.scrollTo(0, y), Math.round(pinTop + 4 * 900 - 250));
await new Promise(r => setTimeout(r, 4500));
await p.screenshot({ path: 'C:/Users/rbhan/AppData/Local/Temp/wd-shots/live-s5.png' });
await b.close();
console.log('done');
