import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appPaths = [
  join(root, "src", "App.tsx"),
  join(root, "src", "cinematic", "CinematicApp.tsx"),
];
const packagePath = join(root, "package.json");
const assistantDir = join(root, "src", "assistant-wd");
const scriptPath = fileURLToPath(import.meta.url);

// Backend files for the LIMEX Assistant (inert without the route, dropped for completeness).
const serverChatService = join(root, "server", "src", "services", "chat.service.ts");
const serverKnowledge = join(root, "server", "src", "services", "limex-knowledge.ts");
const serverController = join(root, "server", "src", "controllers", "chat.controller.ts");

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

// Use try/catch instead of existsSync to avoid TOCTOU races.
for (const appPath of appPaths) {
  try {
    let app = readFileSync(appPath, "utf8");
    app = stripBlock(app, "ASSISTANT-WD");
    app = app.replace(/\n{3,}/g, "\n\n");
    writeFileSync(appPath, app);
  } catch {
    // File absent — nothing to strip.
  }
}

try {
  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  if (pkg.scripts) {
    delete pkg.scripts["remove:assistant:wd"];
  }
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
} catch {
  // package.json absent — skip.
}

// rmSync with force:true is idempotent — no existsSync needed.
rmSync(assistantDir, { recursive: true, force: true });
for (const file of [serverChatService, serverKnowledge, serverController]) {
  rmSync(file, { force: true });
}

console.log(
  "Removed the LIMEX Assistant frontend widget + backend chat service files.\n" +
  "NOTE: also remove the `POST /chat` route, `chatSchema`, `chatLimiter`, and the\n" +
  "LLM_* env entries (server/src/routes/public.routes.ts, validators, rateLimit\n" +
  "middleware, config/env.ts, render.yaml) — these are shared files, left untouched.",
);

rmSync(scriptPath, { force: true });
