import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appPath = join(root, "src", "App.tsx");
const mainPath = join(root, "src", "main.tsx");
const packagePath = join(root, "package.json");
const continuityDir = join(root, "src", "continuity-wd");
const swPath = join(root, "public", "sw.js");
const scriptPath = fileURLToPath(import.meta.url);

function stripBlock(source, tag) {
  const jsxBlock = new RegExp(
    `\\n?\\s*\\{\\/\\* ${tag}-BEGIN (\\S+) \\*\\/\\}[\\s\\S]*?\\{\\/\\* ${tag}-END \\1 \\*\\/\\}`,
    "g",
  );
  source = source.replace(jsxBlock, "");

  const jsBlock = new RegExp(
    `\\n?\\/\\/ ${tag}-BEGIN (\\S+)[\\s\\S]*?\\/\\/ ${tag}-END \\1\\n?`,
    "g",
  );
  source = source.replace(jsBlock, "\n");

  return source;
}

if (existsSync(appPath)) {
  let app = readFileSync(appPath, "utf8");
  app = stripBlock(app, "CONTINUITY-WD");
  app = app.replace(/\n{3,}/g, "\n\n");
  writeFileSync(appPath, app);
}

if (existsSync(mainPath)) {
  let main = readFileSync(mainPath, "utf8");
  main = stripBlock(main, "CONTINUITY-WD");
  main = main.replace(/\n{3,}/g, "\n\n");
  writeFileSync(mainPath, main);
}

if (existsSync(packagePath)) {
  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  if (pkg.scripts) {
    delete pkg.scripts["remove:continuity:wd"];
  }
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

if (existsSync(continuityDir)) {
  rmSync(continuityDir, { recursive: true, force: true });
}

if (existsSync(swPath)) {
  rmSync(swPath, { force: true });
}

rmSync(scriptPath, { force: true });

const scriptsDir = join(root, "scripts");
try {
  rmSync(scriptsDir, { recursive: false, force: false });
} catch {
  // Keep folder if other scripts exist.
}

console.log("Removed White Dot Continuity Layer, service worker, and all integration markers.");
