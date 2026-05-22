import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appPaths = [
  join(root, "src", "App.tsx"),
  join(root, "src", "cinematic", "CinematicApp.tsx"),
];
const indexPath = join(root, "index.html");
const packagePath = join(root, "package.json");
const aggDir = join(root, "src", "aggregation-wd");
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

  const htmlBlock = new RegExp(
    `\\n?\\s*<!-- ${tag}-BEGIN (\\S+) -->[\\s\\S]*?<!-- ${tag}-END \\1 -->`,
    "g",
  );
  source = source.replace(htmlBlock, "");

  return source;
}

for (const appPath of appPaths) {
  if (existsSync(appPath)) {
    let app = readFileSync(appPath, "utf8");
    app = stripBlock(app, "AGGREGATION-WD");
    app = app.replace(/\n{3,}/g, "\n\n");
    writeFileSync(appPath, app);
  }
}

if (existsSync(indexPath)) {
  let html = readFileSync(indexPath, "utf8");
  html = stripBlock(html, "AGGREGATION-WD");
  html = html.replace(/\n{3,}/g, "\n\n");
  writeFileSync(indexPath, html);
}

if (existsSync(packagePath)) {
  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  if (pkg.scripts) {
    delete pkg.scripts["remove:aggregation:wd"];
  }
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

if (existsSync(aggDir)) {
  rmSync(aggDir, { recursive: true, force: true });
}

rmSync(scriptPath, { force: true });

const scriptsDir = join(root, "scripts");
try {
  rmSync(scriptsDir, { recursive: false, force: false });
} catch {
  // Keep folder if other scripts exist.
}

console.log("Removed White Dot Aggregation Sequence and all integration markers.");
