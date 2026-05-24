#!/usr/bin/env node
/**
 * wire-higgsfield-loop.mjs
 *
 * One-shot helper: drop a Higgsfield-generated hero loop into the site.
 *
 * Usage:
 *   node scripts/wire-higgsfield-loop.mjs path/to/born-loop.mp4
 *
 * What it does:
 *   1. Copies (or transcodes via ffmpeg when available) the mp4 to
 *      public/assets/higgsfield/born-loop.mp4
 *   2. Extracts a poster frame at 0.5s when ffmpeg is available →
 *      public/assets/higgsfield/born-poster.jpg
 *   3. Edits src/cinematic/higgsfieldAssets.ts to wire heroVideo + heroPoster
 *      in the RAW manifest (no manual edits needed)
 *   4. Prints next-steps (git add / build / push)
 */

import { execFileSync, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Arg check ────────────────────────────────────────────────────────────────
const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/wire-higgsfield-loop.mjs <path-to-born-loop.mp4>");
  process.exit(1);
}
const src = path.resolve(input);
if (!fs.existsSync(src)) {
  console.error(`File not found: ${src}`);
  process.exit(1);
}

// ── Paths ─────────────────────────────────────────────────────────────────────
const DEST_DIR = path.join(ROOT, "public", "assets", "higgsfield");
const DEST_MP4 = path.join(DEST_DIR, "born-loop.mp4");
const DEST_POSTER = path.join(DEST_DIR, "born-poster.jpg");
const MANIFEST = path.join(ROOT, "src", "cinematic", "higgsfieldAssets.ts");

fs.mkdirSync(DEST_DIR, { recursive: true });

// ── ffmpeg availability ───────────────────────────────────────────────────────
function hasFFmpeg() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
const ffmpeg = hasFFmpeg();

// ── Step 1: copy / transcode mp4 ─────────────────────────────────────────────
if (ffmpeg) {
  console.log("ffmpeg detected — transcoding to H.264 faststart …");
  execSync(
    `ffmpeg -y -i "${src}" -c:v libx264 -preset fast -crf 22 -an -movflags +faststart -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" "${DEST_MP4}"`,
    { stdio: "inherit" }
  );
} else {
  console.log("ffmpeg not found — copying mp4 as-is …");
  fs.copyFileSync(src, DEST_MP4);
}
console.log(`  ✓ ${path.relative(ROOT, DEST_MP4)}`);

// ── Step 2: extract poster ────────────────────────────────────────────────────
let posterWired = false;
if (ffmpeg) {
  console.log("Extracting poster frame at 0.5s …");
  try {
    execSync(
      `ffmpeg -y -ss 0.5 -i "${DEST_MP4}" -frames:v 1 -q:v 3 "${DEST_POSTER}"`,
      { stdio: "inherit" }
    );
    console.log(`  ✓ ${path.relative(ROOT, DEST_POSTER)}`);
    posterWired = true;
  } catch (e) {
    console.warn("  ⚠ Poster extraction failed — heroPoster will remain null.");
  }
} else {
  console.log("  ℹ No ffmpeg — skipping poster extraction. heroPoster stays null.");
  console.log("    Drop a 1920×1080 JPEG at public/assets/higgsfield/born-poster.jpg");
  console.log("    then re-run this script to wire it in automatically, OR edit");
  console.log("    src/cinematic/higgsfieldAssets.ts manually.");
}

// ── Step 3: patch higgsfieldAssets.ts ────────────────────────────────────────
console.log("\nPatching src/cinematic/higgsfieldAssets.ts …");

let ts = fs.readFileSync(MANIFEST, "utf8");

// heroVideo: replace whatever value is there with the new path
ts = ts.replace(
  /heroVideo:\s*(null|"[^"]*"),(\s*\/\/[^\n]*)?/,
  `heroVideo: "assets/higgsfield/born-loop.mp4", // Higgsfield loop`
);

// heroPoster: wire only when we extracted a frame
if (posterWired) {
  ts = ts.replace(
    /heroPoster:\s*(null|"[^"]*"),(\s*\/\/[^\n]*)?/,
    `heroPoster: "assets/higgsfield/born-poster.jpg",`
  );
}

fs.writeFileSync(MANIFEST, ts, "utf8");
console.log(`  ✓ heroVideo wired`);
if (posterWired) console.log(`  ✓ heroPoster wired`);

// ── Step 4: summary ───────────────────────────────────────────────────────────
console.log(`
Done. Next steps:

  git add public/assets/higgsfield/born-loop.mp4 ${posterWired ? "public/assets/higgsfield/born-poster.jpg " : ""}src/cinematic/higgsfieldAssets.ts
  git commit -m "feat: add Higgsfield hero loop + poster"
  git push -u origin HEAD
  npm run build       # verify no bundle regressions

The HiggsfieldHero component in BornStatic will now serve the video loop
automatically (with the poster as first-frame / reduced-motion fallback).
`);
