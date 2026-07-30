#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
   White Dot · Case-Study Spec Agent
   Free AI model: Google Gemini 2.0 Flash (generous free tier).

   What it does
   ------------
   Given a product name + a block of KNOWN facts (and optionally a LIMEX
   grade), it drafts a spec object that conforms to specs.json schema and
   writes it to  data/drafts/<id>.json  for human review.

   Accuracy guardrails (critical)
   ------------------------------
   The model is FORBIDDEN from inventing numeric properties. Any value not
   explicitly present in the supplied facts must be emitted as
   "Per lot TDS" with verified:false. This keeps the live data path
   hallucination-free — AI drafts copy + structure, verified humans approve
   numbers, and the browser engine (tds-engine.js) renders + builds the PDF
   deterministically from the approved specs.json.

   Usage
   -----
   setx GEMINI_API_KEY "your_free_key"        (Windows, once)  — or export on *nix
   node agent/spec-agent.mjs --name "Cap" --facts ./facts.txt
   node agent/spec-agent.mjs --name "Cap" --grade PP80-24L --facts "80% CaCO3, PP, injection"

   Get a free key: https://aistudio.google.com/apikey
   ───────────────────────────────────────────────────────────── */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MODEL = "gemini-2.0-flash";
const API_KEY = process.env.GEMINI_API_KEY;

function arg(flag, def = "") {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const NAME = arg("--name");
const GRADE = arg("--grade", "");
let FACTS = arg("--facts", "");

if (!NAME) { console.error("✗ --name is required"); process.exit(1); }
if (!API_KEY) {
  console.error("✗ GEMINI_API_KEY not set. Free key: https://aistudio.google.com/apikey");
  process.exit(1);
}

// --facts may be a file path or an inline string
if (FACTS && existsSync(FACTS)) FACTS = await readFile(FACTS, "utf8");

const id = NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const SYSTEM = `You are a materials-data drafting assistant for White Dot, the Authorized Marketing & Sales of TBM LIMEX (a limestone / calcium-carbonate based composite). White Dot is NOT a partner of TBM — never use the word "partner" or "in partnership".

Produce ONE JSON object (no markdown fences) matching this exact schema:
{
  "id": string, "index": "NN", "name": string, "category": string,
  "status": "live"|"soon", "tagline": string, "description": string,
  "referenceGrade": string, "moulding": string, "application": string,
  "composition": [ { "name": string, "pct": number, "color": "#hex", "verified": boolean, "source"?: string } ],
  "specs": [ { "label": string, "value": string, "unit"?: string, "verified": boolean, "note"?: string, "source"?: string } ],
  "highlights": [ { "num": string, "unit"?: string, "label": string, "verified": boolean } ],
  "co2": { "value": string, "basis": string, "verified": boolean }
}

HARD RULES — accuracy over completeness:
1. Use ONLY numbers that appear in the supplied FACTS. If a property is not in FACTS, set its value to "Per lot TDS", verified:false, and add a note. NEVER invent or estimate a number.
2. LIMEX requires calcium carbonate > 50% by weight. If composition is given, ensure CaCO3 is the majority. Limestone segment color "#e98012", resin color "#c4c7c0".
3. Mark verified:true ONLY for values explicitly stated in FACTS; everything else verified:false.
4. Write the tagline and description in a premium, factual, minimal tone. No hype, no unverifiable claims.
5. CO2: only state a figure if it is in FACTS; otherwise value "Reference value — see TBM LCA", verified:false.
Return strictly the JSON object.`;

const USER = `Product name: ${NAME}
Reference grade: ${GRADE || "(unknown — infer label only, mark unverified)"}
KNOWN FACTS:
${FACTS || "(none supplied — emit a skeleton with all numeric fields as 'Per lot TDS', verified:false)"}`;

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

console.log(`⟳ Drafting spec for "${NAME}" with ${MODEL}…`);

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: USER }] }],
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  }),
});

if (!res.ok) {
  console.error("✗ Gemini error", res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
text = text.replace(/^```json\s*|\s*```$/g, "").trim();

let spec;
try { spec = JSON.parse(text); }
catch (e) { console.error("✗ Model did not return valid JSON:\n", text); process.exit(1); }

spec.id = id;
// Safety net: force any blank numeric value to the unverified placeholder
(spec.specs || []).forEach((s) => {
  if (s.value == null || s.value === "") { s.value = "Per lot TDS"; s.verified = false; }
});

const draftsDir = path.join(ROOT, "data", "drafts");
await mkdir(draftsDir, { recursive: true });
const out = path.join(draftsDir, `${id}.json`);
await writeFile(out, JSON.stringify(spec, null, 2) + "\n", "utf8");

const verified = (spec.specs || []).filter((s) => s.verified).length;
const total = (spec.specs || []).length;
console.log(`✓ Draft written: ${path.relative(ROOT, out)}`);
console.log(`  ${verified}/${total} specs verified from supplied facts; the rest marked "Per lot TDS".`);
console.log(`  Review, then merge into data/specs.json under products.${id} to publish.`);
console.log(`  The page engine + PDF TDS will then work for ?product=${id} automatically.`);
