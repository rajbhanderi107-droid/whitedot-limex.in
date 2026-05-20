// "remove allplan" — fully reverts the cinematic rebuild and restores the
// pre-cinematic Limestone Light site exactly as it was at the `pre-allplan` git tag.
//
// Run: npm run remove:allplan
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const scriptPath = fileURLToPath(import.meta.url);

function run(cmd) {
  return execSync(cmd, { cwd: root, stdio: "pipe" }).toString().trim();
}

// 1. Confirm the snapshot tag exists.
let hasTag = false;
try {
  run("git rev-parse --verify pre-allplan");
  hasTag = true;
} catch {
  hasTag = false;
}

if (!hasTag) {
  console.error(
    "[remove allplan] No `pre-allplan` git tag found. Cannot auto-restore.\n" +
      "Restore manually from your last known-good commit instead.",
  );
  process.exit(1);
}

// 2. Restore all tracked source/config files to the pre-cinematic snapshot.
console.log("[remove allplan] Restoring files from the pre-allplan snapshot...");
run("git checkout pre-allplan -- src index.html package.json package-lock.json");

// 3. Delete cinematic-only additions that did not exist before.
const cinematicPaths = [join(root, "src", "cinematic")];
for (const p of cinematicPaths) {
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    console.log(`[remove allplan] Deleted ${p}`);
  }
}

// 4. Resync dependencies to the restored package.json.
console.log("[remove allplan] Reinstalling dependencies (this restores three/r3f removal etc.)...");
try {
  run("npm install");
} catch {
  console.warn("[remove allplan] npm install reported issues — run it manually if needed.");
}

// 5. Self-delete this script (it was added by the cinematic build).
rmSync(scriptPath, { force: true });

console.log(
  "\n[remove allplan] Done. The Limestone Light site is restored.\n" +
    "Note: the remove:allplan npm script entry was restored away with package.json.\n" +
    "Review with `git status` and commit when you're happy.",
);
