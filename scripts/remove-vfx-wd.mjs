import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appPath = join(root, "src", "App.tsx");
const packagePath = join(root, "package.json");
const vfxDir = join(root, "src", "vfx-wd");
const vfxAssets = [join(root, "public", "assets", "limex-mineral-real.webp")];
const scriptPath = fileURLToPath(import.meta.url);

function removeJsxBlock(source, name) {
  const pattern = new RegExp(`\\n?\\s*\\{\\/\\* VFX-WD-BEGIN ${name} \\*\\/\\}[\\s\\S]*?\\{\\/\\* VFX-WD-END ${name} \\*\\/\\}`, "g");
  return source.replace(pattern, "");
}

function removeTsBlock(source, name) {
  const pattern = new RegExp(`\\n?\\/\\/ VFX-WD-BEGIN ${name}[\\s\\S]*?\\/\\/ VFX-WD-END ${name}\\n?`, "g");
  return source.replace(pattern, "\n");
}

function stripClassToken(source, token) {
  return source
    .replace(new RegExp(` ${token}`, "g"), "")
    .replace(new RegExp(`${token} `, "g"), "")
    .replace(new RegExp(`${token}`, "g"), "");
}

if (existsSync(appPath)) {
  let app = readFileSync(appPath, "utf8");
  app = app.replace(/\n?\/\/ VFX-WD-BEGIN imports[\s\S]*?\/\/ VFX-WD-END imports\n?/g, "\n");
  app = removeTsBlock(app, "product-data");
  app = app.replace(
    /\n?\s*\{\/\* VFX-WD-BEGIN hero-scene \*\/\}\s*<MineralHeroScene \/>\s*\{\/\* VFX-WD-END hero-scene \*\/\}/g,
    "\n      <HeroScene />",
  );

  [
    "app-controller",
    "nav-links",
    "hero-proof",
    "journey-section",
    "calculator-section",
    "trust-badge",
    "product-visual",
    "contact-form",
  ].forEach((block) => {
    app = removeJsxBlock(app, block);
  });

  [
    "vfx-wd-shell",
    "vfx-wd-hero-panel",
    "vfx-wd-magnetic",
    "vfx-wd-trust-card",
    "vfx-wd-tilt",
    "vfx-wd-product-card",
    "vfx-wd-final-cta",
  ].forEach((token) => {
    app = stripClassToken(app, token);
  });

  app = app.replace(/\sdata-vfx-tilt/g, "");
  app = app.replace(/\n{3,}/g, "\n\n");
  writeFileSync(appPath, app);
}

if (existsSync(packagePath)) {
  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  if (pkg.dependencies) {
    delete pkg.dependencies.gsap;
    delete pkg.dependencies["lottie-web"];
  }
  if (pkg.scripts) {
    delete pkg.scripts["remove:vfx:wd"];
  }
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

if (existsSync(vfxDir)) {
  rmSync(vfxDir, { recursive: true, force: true });
}

vfxAssets.forEach((assetPath) => {
  rmSync(assetPath, { force: true });
});

rmSync(scriptPath, { force: true });

const scriptsDir = join(root, "scripts");
try {
  rmSync(scriptsDir, { recursive: false, force: false });
} catch {
  // Keep the folder if other scripts exist.
}

console.log("Removed White Dot VFX module and App integration markers.");
