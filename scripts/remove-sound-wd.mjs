import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appPath = join(root, "src", "App.tsx");
const packagePath = join(root, "package.json");
const soundDir = join(root, "src", "sound-wd");
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
  app = stripBlock(app, "SOUND-WD");
  app = app.replace(/\n{3,}/g, "\n\n");
  writeFileSync(appPath, app);
}

if (existsSync(packagePath)) {
  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  if (pkg.scripts) {
    delete pkg.scripts["remove:sound:wd"];
  }
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

if (existsSync(soundDir)) {
  rmSync(soundDir, { recursive: true, force: true });
}

rmSync(scriptPath, { force: true });

const scriptsDir = join(root, "scripts");
try {
  rmSync(scriptsDir, { recursive: false, force: false });
} catch {
  // Keep folder if other scripts exist.
}

console.log("Removed White Dot Mineral Sound System and all integration markers.");
