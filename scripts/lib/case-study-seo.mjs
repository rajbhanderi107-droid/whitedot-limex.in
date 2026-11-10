// Shared by scripts/build-seo.mjs (every build) and
// scripts/render-case-study-og.mjs (3D share images, run on demand).
// One place for: which case studies exist, what each one's title and
// description are, and how its share card is drawn.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const SITE = "https://whitedotindia.in";
export const CARD_W = 1200;
export const CARD_H = 630;

const readJson = (rel) => JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));

/** Every live case study, with the same title/description product.html shows. */
export function loadCaseStudies() {
  const list = readJson("public/case-study/data/products.json").products || [];
  const specs = readJson("public/case-study/data/specs.json").products || {};
  return list
    .filter((p) => p.status === "live" && /^[a-z0-9-]+$/.test(p.slug || ""))
    .map((p) => {
      const full = specs[p.id] || {};
      const inLimex = full.dataKind === "photo-reference" ? "" : " in LIMEX";
      return {
        id: p.id,
        slug: p.slug,
        index: p.index,
        name: p.name,
        category: p.category,
        mixRatio: full.mixRatio || "",
        title: `${p.name} — ${p.category}${inLimex} | White Dot Case Study`,
        description:
          full.tagline ||
          `${p.name}: a ${p.category.toLowerCase()} case study exploring LIMEX limestone-based material. Explore it in interactive 3D.`,
        url: `${SITE}/case-study/${p.slug}.html`,
        image: `${SITE}/case-study/og/${p.slug}.jpg`,
      };
    });
}

export const escapeXml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function wrap(text, maxChars) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + " " + word : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Draw the 1200x630 share card. `shot` is an optional transparent PNG of the
 * product's 3D model; without it the card is name-and-brand only, which is
 * what a brand-new case study gets until its model has been rendered.
 */
export async function composeCard(study, shot) {
  const textWidth = shot ? 530 : 1040;
  let size = 76;
  let lines = wrap(study.name, Math.floor(textWidth / (size * 0.56)));
  while ((lines.length > 3 || lines.some((l) => l.length * size * 0.56 > textWidth)) && size > 40) {
    size -= 4;
    lines = wrap(study.name, Math.floor(textWidth / (size * 0.56)));
  }
  const lineH = Math.round(size * 1.08);
  const blockTop = 300 - ((lines.length - 1) * lineH) / 2;
  const font = `font-family="Inter, 'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif"`;
  const name = lines
    .map((l, i) => `<text x="80" y="${blockTop + i * lineH}" ${font} font-size="${size}" font-weight="700" fill="#111111" letter-spacing="-1.5">${escapeXml(l)}</text>`)
    .join("");
  const afterName = blockTop + (lines.length - 1) * lineH;
  const mix = study.mixRatio
    ? `<text x="80" y="${afterName + 104}" ${font} font-size="24" font-weight="500" fill="#3a7526">${escapeXml(study.mixRatio.length > 46 ? study.mixRatio.slice(0, 45) + "…" : study.mixRatio)}</text>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}">
  <defs>
    <radialGradient id="g" cx="74%" cy="50%" r="60%">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f7f4ec"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#f7f4ec"/>
  <rect width="100%" height="100%" fill="url(#g)"/>
  ${shot ? '<rect x="650" y="65" width="490" height="500" rx="28" fill="#dedacb"/>' : ""}
  <rect x="0" y="0" width="10" height="${CARD_H}" fill="#4f9a35"/>
  <text x="80" y="96" ${font} font-size="22" font-weight="600" fill="#3a7526" letter-spacing="4">LIMEX CASE STUDY ${escapeXml(study.index || "")}</text>
  ${name}
  <text x="80" y="${afterName + 58}" ${font} font-size="30" font-weight="500" fill="#444444">${escapeXml(study.category)}</text>
  ${mix}
  <circle cx="90" cy="548" r="10" fill="#111111"/>
  <text x="114" y="558" ${font} font-size="28" font-weight="700" fill="#111111">White Dot</text>
  <text x="270" y="558" ${font} font-size="22" font-weight="400" fill="#6f6f6f">whitedotindia.in</text>
</svg>`;
  const layers = [];
  if (shot) {
    const fitted = await sharp(shot)
      .trim()
      .resize(420, 430, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer({ resolveWithObject: true });
    layers.push({
      input: fitted.data,
      left: Math.round(895 - fitted.info.width / 2),
      top: Math.round(CARD_H / 2 - fitted.info.height / 2),
    });
  }
  return sharp(Buffer.from(svg)).composite(layers).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
}
