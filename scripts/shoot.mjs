// Dev screenshot helper: drives installed Chrome headless, scrolls the pinned
// MaterialStory section scene-by-scene, saves PNGs. Usage: node scripts/shoot.mjs
import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://127.0.0.1:5173/?wd_preview=1';
const OUT = process.env.OUT_DIR || 'C:/Users/rbhan/AppData/Local/Temp/wd-shots';

import { mkdirSync } from 'fs';
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--window-size=1440,900', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise((r) => setTimeout(r, 2500)); // fonts, GSAP init

// full hero shot
await page.screenshot({ path: `${OUT}/00-hero.png` });

// find pinned section start
const pinTop = await page.evaluate(() => {
  const el = document.getElementById('material');
  return el ? el.getBoundingClientRect().top + window.scrollY : 0;
});
const vh = 900;
const N = 8;

for (let i = 0; i < N; i++) {
  const y = Math.round(pinTop + i * vh);
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await new Promise((r) => setTimeout(r, 1800)); // scrub catch-up + snap + video frame
  await page.screenshot({ path: `${OUT}/scene-${i + 1}.png` });
}

// post-section shot (next section visible, dots gone)
await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(pinTop + (N - 1) * vh + 1200));
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: `${OUT}/99-after.png` });

await browser.close();
console.log('done ->', OUT);
