/* Home-screen icons for the four standalone book apps.
 *
 * Run with `node scripts/build-book-icons.mjs`. The PNGs it writes are
 * committed, so a deploy never depends on sharp being installed.
 *
 * One family, four colours: a dark tile, the WhiteDot mark, and the book's
 * own glyph. They have to be told apart at 40 px on a phone home screen, so
 * each glyph is a single shape in a single colour — no detail that survives
 * only at 512. Everything stays inside the middle 80% so a maskable icon is
 * not cropped into on Android.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/assets/icons");
const TILE = "#0f1210";

/** Each glyph is drawn on a 512 grid, inside the 52–460 safe area. */
const BOOKS = {
  route: {
    color: "#4f9a35",
    // Three stops on a run, joined by the road between them.
    glyph: `
      <path d="M132 350 C132 250 200 236 256 236 C312 236 380 250 380 162"
            fill="none" stroke="COLOR" stroke-width="26" stroke-linecap="round"
            stroke-dasharray="4 46" opacity="0.55"/>
      <circle cx="132" cy="350" r="34" fill="COLOR"/>
      <circle cx="256" cy="236" r="34" fill="COLOR" opacity="0.75"/>
      <circle cx="380" cy="162" r="34" fill="COLOR" opacity="0.5"/>`,
  },
  visits: {
    color: "#8f6fb5",
    // A clock: this book is about when you go back. Deliberately the only
    // curve-and-hands shape in the set, so it never reads as the road, the
    // arrow or the shield at 40 px.
    glyph: `
      <circle cx="256" cy="256" r="168" fill="none" stroke="COLOR" stroke-width="30"/>
      <path d="M256 150 L256 262 L338 306" fill="none" stroke="COLOR"
            stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  leads: {
    color: "#e0a040",
    // A deal moving up and to the right.
    glyph: `
      <path d="M112 372 L232 252 L308 328 L432 204" fill="none" stroke="COLOR"
            stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M348 188 L440 188 L440 280" fill="none" stroke="COLOR"
            stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  customers: {
    color: "#2f9fc0",
    // Signed and done.
    glyph: `
      <path d="M256 76 L420 140 L420 262 C420 358 348 414 256 444
               C164 414 92 358 92 262 L92 140 Z"
            fill="none" stroke="COLOR" stroke-width="28" stroke-linejoin="round" opacity="0.45"/>
      <path d="M182 262 L238 318 L336 196" fill="none" stroke="COLOR"
            stroke-width="38" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
};

const svgFor = (book, { rounded }) => {
  const { color, glyph } = BOOKS[book];
  const bg = rounded
    ? `<rect width="512" height="512" rx="114" fill="${TILE}"/>`
    : `<rect width="512" height="512" fill="${TILE}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${bg}
  ${glyph.replaceAll("COLOR", color)}
</svg>`;
};

mkdirSync(OUT, { recursive: true });

for (const book of Object.keys(BOOKS)) {
  // 192/512: the manifest pair. 180: what iOS uses for Add to Home Screen —
  // it applies its own rounding, so that one ships square.
  const jobs = [
    { size: 512, rounded: true, name: `${book}-512.png` },
    { size: 192, rounded: true, name: `${book}-192.png` },
    { size: 180, rounded: false, name: `${book}-apple-180.png` },
  ];
  for (const { size, rounded, name } of jobs) {
    const png = await sharp(Buffer.from(svgFor(book, { rounded })))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toBuffer();
    writeFileSync(resolve(OUT, name), png);
    console.log(`${name}  ${png.length} bytes`);
  }
  writeFileSync(resolve(OUT, `${book}.svg`), svgFor(book, { rounded: true }));
}
