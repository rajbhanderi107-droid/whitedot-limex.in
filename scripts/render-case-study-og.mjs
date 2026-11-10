// Renders each case study's real 3D model into its share image,
// public/case-study/og/<slug>.jpg (1200x630). Run on demand and commit the
// result:
//
//   npm run og:render            only the case studies that have no image yet
//   npm run og:render -- --all   redo every one
//   npm run og:render -- bobbin  just the named slugs
//
// The build does not need this: a case study without a committed image still
// gets a name card from scripts/build-seo.mjs. This only upgrades the card to
// show the product itself. It opens the real product page, so the model and
// camera angle are exactly what a visitor sees.
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { chromium } from "playwright";
import { ROOT, loadCaseStudies, composeCard } from "./lib/case-study-seo.mjs";

const publicDir = resolve(ROOT, "public");
const outDir = resolve(publicDir, "case-study/og");
const args = process.argv.slice(2);
const all = args.includes("--all");
const named = args.filter((a) => !a.startsWith("--"));

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
  ".glb": "model/gltf-binary", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".css": "text/css", ".wasm": "application/wasm", ".hdr": "application/octet-stream",
};
const server = createServer((req, res) => {
  const path = resolve(publicDir, "." + decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!(path === publicDir || path.startsWith(publicDir + sep)) || !existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" });
  res.end(readFileSync(path));
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;

const studies = loadCaseStudies().filter((s) =>
  named.length ? named.includes(s.slug) : all || !existsSync(resolve(outDir, `${s.slug}.jpg`)),
);
mkdirSync(outDir, { recursive: true });
console.log(`[og:render] ${studies.length} case stud${studies.length === 1 ? "y" : "ies"} to render`);

const browser = await chromium.launch({
  // Set CHROME_PATH to use an already-installed Chrome/Chromium instead of
  // Playwright's own download (npx playwright install chromium).
  executablePath: process.env.CHROME_PATH || undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const failed = [];
for (const study of studies) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1100 }, deviceScaleFactor: 1 });
  // No analytics hits, and no web fonts to wait on, from a render run.
  await page.route(/googletagmanager|google-analytics|fonts\.g/, (route) => route.abort());
  try {
    await page.goto(`${base}/case-study/product.html?p=${study.slug}`, { waitUntil: "domcontentloaded" });
    const viewer = page.locator("model-viewer").first();
    await viewer.waitFor({ state: "attached", timeout: 20000 });
    await viewer.evaluate(
      (el) =>
        new Promise((done, fail) => {
          el.removeAttribute("auto-rotate");
          el.setAttribute("loading", "eager");
          el.setAttribute("reveal", "auto");
          if (el.loaded) return done();
          el.addEventListener("load", () => done(), { once: true });
          el.addEventListener("error", () => fail(new Error("model failed to load")), { once: true });
          setTimeout(() => fail(new Error("model load timed out")), 60000);
        }),
    );
    // Hide everything except the viewer, so the shot is the product alone on
    // a transparent background.
    await page.addStyleTag({
      content: `html,body{background:transparent!important;animation:none!important}
        body *{visibility:hidden!important}
        model-viewer{visibility:visible!important;background:transparent!important;opacity:1!important}`,
    });
    await viewer.evaluate(async (el) => {
      // Same angle as the page, pulled back so the whole product is in frame.
      const [theta, phi] = (el.getAttribute("camera-orbit") || "0deg 76deg").split(/\s+/);
      el.setAttribute("max-camera-orbit", "auto auto 400%");
      el.setAttribute("camera-orbit", `${theta} ${phi} 150%`);
      await el.updateComplete;
      el.jumpCameraToGoal?.();
      await el.updateComplete;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    await page.waitForTimeout(1200);
    const box = await viewer.evaluate((el) => {
      el.scrollIntoView({ block: "center", inline: "center" });
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    if (box.width < 50 || box.height < 50) throw new Error("3D viewer has no size on the page");
    const clip = {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y),
      width: Math.min(box.width, 1100 - Math.max(0, box.x)),
      height: Math.min(box.height, 1100 - Math.max(0, box.y)),
    };
    const shot = await page.screenshot({ omitBackground: true, type: "png", clip });
    writeFileSync(resolve(outDir, `${study.slug}.jpg`), await composeCard(study, shot));
    console.log(`  ✓ ${study.slug}`);
  } catch (error) {
    failed.push(study.slug);
    console.warn(`  ✗ ${study.slug}: ${error.message}`);
  } finally {
    await page.close();
  }
}
await browser.close();
server.close();
if (failed.length) {
  console.warn(`[og:render] ${failed.length} not rendered (they keep the name card): ${failed.join(", ")}`);
  process.exitCode = 1;
}
