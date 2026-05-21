import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cinematicAppPath = join(root, "src", "cinematic", "CinematicApp.tsx");
const mainPath = join(root, "src", "main.tsx");
const packagePath = join(root, "package.json");
const premiumDir = join(root, "src", "premium-wd");
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

if (existsSync(cinematicAppPath)) {
  let app = readFileSync(cinematicAppPath, "utf8");
  app = stripBlock(app, "PREMIUM-WD");
  // The provider wraps the tree; once its import/JSX are stripped, fall back to
  // an always-on premium experience by replacing usePremium() with a literal.
  app = app.replace(/usePremium\(\)/g, "true");
  app = app.replace(/\n{3,}/g, "\n\n");
  writeFileSync(cinematicAppPath, app);
}

if (existsSync(mainPath)) {
  let main = readFileSync(mainPath, "utf8");
  main = stripBlock(main, "PREMIUM-WD");
  // Unwrap the provider: drop the opening/closing tags but keep the app element.
  main = main.replace(/<PremiumProvider>\s*/g, "");
  main = main.replace(/\s*<\/PremiumProvider>/g, "");
  main = main.replace(/\n{3,}/g, "\n\n");
  writeFileSync(mainPath, main);
}

if (existsSync(packagePath)) {
  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  if (pkg.scripts) {
    delete pkg.scripts["remove:premium:wd"];
  }
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

if (existsSync(premiumDir)) {
  rmSync(premiumDir, { recursive: true, force: true });
}

rmSync(scriptPath, { force: true });

console.log("Removed White Dot Premium master architecture and all integration markers.");
