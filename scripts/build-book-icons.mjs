/* Home-screen icons for the four standalone book apps.
 *
 * Run with `node scripts/build-book-icons.mjs`. The PNGs it writes are
 * committed, so a deploy never depends on sharp being installed.
 *
 * The icon is the website's own logo — public/assets/whitedot-main-logo.png,
 * the same mark the site renders through src/brand.ts — composited onto a
 * dark tile. Not a redrawing of it: the actual file, so the app on a phone
 * home screen and the site in a browser tab are unmistakably one company.
 *
 * Four of these apps sit on the same home screen, so a slim bar under the
 * logo carries each book's colour. It never touches the logo itself, and
 * deleting the one rect below returns all four to the plain mark.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/assets/icons");
const LOGO = resolve(ROOT, "public/assets/whitedot-main-logo.png");
const TILE = "#0f1210";

/** One colour each, far enough apart in hue to read at 40 px. */
const BOOKS = {
  route: "#5cb43c",
  visits: "#9b7fd4",
  leads: "#e0a040",
  customers: "#33b0d4",
};

/* Drawn on a 512 grid. The logo occupies 392 px centred a little high, which
   keeps everything inside the middle 80% — the safe area Android crops a
   maskable icon to. */
const LOGO_SIZE = 392;
const LOGO_X = (512 - LOGO_SIZE) / 2;
const LOGO_Y = 40;

const tile = (color, rounded) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512"${rounded ? ' rx="114"' : ""} fill="${TILE}"/>
  <rect x="186" y="436" width="140" height="16" rx="8" fill="${color}"/>
</svg>`,
);

mkdirSync(OUT, { recursive: true });

const logo = await sharp(LOGO).resize(LOGO_SIZE, LOGO_SIZE).png().toBuffer();

for (const [book, color] of Object.entries(BOOKS)) {
  // 192/512: the manifest pair. 180: what iOS uses for Add to Home Screen —
  // it applies its own rounding, so that one ships square.
  const jobs = [
    { size: 512, rounded: true, name: `${book}-512.png` },
    { size: 192, rounded: true, name: `${book}-192.png` },
    { size: 180, rounded: false, name: `${book}-apple-180.png` },
  ];
  // Compose at full size first: sharp resizes before it composites, so a
  // 392 px logo will not fit a base already shrunk to 192.
  const masters = {
    rounded: await sharp(tile(color, true)).composite([{ input: logo, left: LOGO_X, top: LOGO_Y }]).png().toBuffer(),
    square: await sharp(tile(color, false)).composite([{ input: logo, left: LOGO_X, top: LOGO_Y }]).png().toBuffer(),
  };
  for (const { size, rounded, name } of jobs) {
    const png = await sharp(rounded ? masters.rounded : masters.square)
      .resize(size, size)
      // The logo is a rich 3D render, so lossless PNG costs ~200 kB an icon.
      // A 256-colour palette is visually identical at every size these are
      // ever seen at, and about a quarter of the bytes.
      .png({ palette: true, compressionLevel: 9 })
      .toBuffer();
    writeFileSync(resolve(OUT, name), png);
    console.log(`${name}  ${png.length} bytes`);
  }
}
