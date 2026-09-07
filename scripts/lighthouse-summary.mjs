/* Prints why Lighthouse CI failed, straight into the job log.
 *
 * `lhci assert` only reports the category score — "best-practices 0.93" tells
 * you nothing about which audit dropped it, and the HTML report lives in a
 * dot-directory that upload-artifact skips by default. So read the run's own
 * JSON and name the audits, in the log where the failure already is.
 *
 * Run with `node scripts/lighthouse-summary.mjs` after `lhci collect`.
 * Never fails the job itself — `lhci assert` decides that.
 */

import { existsSync, readdirSync, readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const DIR = ".lighthouseci";

/** Categories worth explaining, in the order the report shows them. */
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

const out = [];
const say = (line = "") => { out.push(line); console.log(line); };

if (!existsSync(DIR)) {
  console.log(`No ${DIR}/ — Lighthouse did not get as far as writing a report.`);
  process.exit(0);
}

const files = readdirSync(DIR).filter((f) => f.startsWith("lhr-") && f.endsWith(".json")).sort();
if (!files.length) {
  console.log(`No run reports in ${DIR}/.`);
  process.exit(0);
}

/* Several runs of the same page: report the last, and note where the runs
   disagreed, because a score that moves is a flaky audit, not a regression. */
const runs = files.map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")));
const last = runs[runs.length - 1];

say(`### Lighthouse — ${last.finalDisplayedUrl ?? last.finalUrl}`);
say();
say(`${runs.length} run${runs.length === 1 ? "" : "s"}, scores from each:`);
say();
say("| Category | " + runs.map((_, i) => `Run ${i + 1}`).join(" | ") + " |");
say("| --- | " + runs.map(() => "---").join(" | ") + " |");
for (const key of CATEGORIES) {
  const cells = runs.map((r) => {
    const s = r.categories[key]?.score;
    return s == null ? "—" : s.toFixed(2);
  });
  say(`| ${last.categories[key]?.title ?? key} | ${cells.join(" | ")} |`);
}

for (const key of CATEGORIES) {
  const cat = last.categories[key];
  if (!cat) continue;
  const failed = cat.auditRefs
    .filter((ref) => ref.weight > 0)
    .map((ref) => ({ ref, audit: last.audits[ref.id] }))
    .filter(({ audit }) => audit && audit.score !== null && audit.score < 1);
  if (!failed.length) continue;

  say();
  say(`#### ${cat.title} — ${cat.score?.toFixed(2)}`);
  for (const { ref, audit } of failed) {
    say(`- **${audit.title}** (\`${audit.id}\`, weight ${ref.weight}, score ${audit.score})`);
    if (audit.displayValue) say(`  - ${audit.displayValue}`);
    /* The items are the whole point: the console error, the oversized
       image, the failing element. Three is enough to act on. */
    for (const item of (audit.details?.items ?? []).slice(0, 3)) {
      const what = item.description ?? item.statistic ?? item.node?.snippet ?? item.label ?? "";
      const where = item.sourceLocation?.url ?? item.url ?? item.source ?? "";
      if (what || where) say(`  - ${[what, where].filter(Boolean).join(" — ")}`);
    }
  }
}

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, out.join("\n") + "\n");
}
