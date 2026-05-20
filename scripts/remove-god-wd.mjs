// "undo god" — removes everything created by the GOD-WD module:
// legal briefs + LIMEX-vs-fillers comparison, their markers in App.tsx,
// the framer-motion dependency (if unused elsewhere), the npm script,
// and the god-wd folder. The script then deletes itself.
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appPath = join(root, "src", "App.tsx");
const packagePath = join(root, "package.json");
const godDir = join(root, "src", "god-wd");
const srcDir = join(root, "src");
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

// 1. Strip GOD-WD markers + content from App.tsx
if (existsSync(appPath)) {
  let app = readFileSync(appPath, "utf8");
  app = stripBlock(app, "GOD-WD");
  app = app.replace(/\n{3,}/g, "\n\n");
  writeFileSync(appPath, app);
}

// 2. Delete the god-wd folder
if (existsSync(godDir)) {
  rmSync(godDir, { recursive: true, force: true });
}

// 3. Decide whether framer-motion is still used anywhere in src
function usesFramerMotion(dir) {
  if (!existsSync(dir)) return false;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      if (usesFramerMotion(full)) return true;
    } else if ([".ts", ".tsx", ".js", ".jsx"].includes(extname(full))) {
      if (readFileSync(full, "utf8").includes("framer-motion")) return true;
    }
  }
  return false;
}
const framerStillUsed = usesFramerMotion(srcDir);

// 4. Update package.json: drop the npm script, and framer-motion if unused
if (existsSync(packagePath)) {
  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  if (pkg.scripts) {
    delete pkg.scripts["remove:god:wd"];
  }
  if (!framerStillUsed && pkg.dependencies) {
    delete pkg.dependencies["framer-motion"];
  }
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

// 5. Self-delete, and remove the scripts folder if now empty
rmSync(scriptPath, { force: true });
const scriptsDir = join(root, "scripts");
try {
  rmSync(scriptsDir, { recursive: false, force: false });
} catch {
  // Keep folder if other scripts exist.
}

console.log(
  framerStillUsed
    ? "Undid GOD-WD (legal briefs + LIMEX comparison). framer-motion kept — still used elsewhere. Run npm install to prune lockfile if needed."
    : "Undid GOD-WD (legal briefs + LIMEX comparison) and removed framer-motion. Run npm install to update the lockfile.",
);
