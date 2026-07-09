# Case-Study Spec Engine + AI Agent

Two parts, designed so the **live data is never AI-generated**:

## 1. The Engine (`js/tds-engine.js`) — runs in the browser, free, deterministic
- Reads `data/specs.json` (the single source of truth).
- Shows a "verified" badge counting how many fields are cited.
- Generates a downloadable **PDF Technical Data Sheet** on the "Download TDS" button using jsPDF (loaded from CDN, no key, no backend).
- The PDF data path is 100% deterministic — it copies verified JSON, so the sheet cannot hallucinate.

## 2. The AI Agent (`agent/spec-agent.mjs`) — runs offline, free model, drafts only
Generates a *draft* spec for a **new** product, for human review.

```bash
# one-time: get a free key at https://aistudio.google.com/apikey
export GEMINI_API_KEY=...        # Windows: setx GEMINI_API_KEY "..."

node agent/spec-agent.mjs --name "Cap" --grade PP80-24L --facts ./cap-facts.txt
```

- Model: **Google Gemini 2.0 Flash** (free tier).
- The agent is **forbidden from inventing numbers** — any property not in your supplied facts is written as `"Per lot TDS"` with `verified:false`.
- Output goes to `data/drafts/<id>.json` (NOT the live file).
- After you review/correct it, copy the object into `data/specs.json` under `products.<id>` to publish. The page + PDF then work for that product automatically.

## Why this split?
"1000% accuracy" and "AI generation" are in tension — LLMs hallucinate spec numbers. So AI only drafts structure + copy; **verified humans approve the numbers**; the browser engine renders and builds the PDF with zero AI in the data path.

## Data provenance (bobbin, verified 2026-06-23)
Authoritative source = White Dot's official **"LIMEX Case Studies in India"** PDF, which specifies the bobbin as:
> Bobbin of Textile Industry by Injection moulding — **40% LIMEX PE78-02M + 60% PP Homo Polymer**

| Field | Value | Source |
|---|---|---|
| LIMEX grade | PE78-02M | WD Case Studies PDF |
| Mixing ratio | 40% LIMEX + 60% PP homo-polymer | WD Case Studies PDF |
| Process | Injection moulding | WD Case Studies PDF |
| PE78-02M CaCO₃ | 78% | greensourcinghub PE78-02M |
| PE78-02M density | 1.90 g/cm³ | greensourcinghub PE78-02M |
| PE78-02M MFR | 0.6 g/10min | greensourcinghub PE78-02M |
| PE78-02M GHG | 0.542 kg-CO₂e/kg | greensourcinghub PE78-02M |
| Effective limestone in part | ~31% (40% × 78%) | derived |
| CO₂e reduction | ~24–38% (LCA, app-dependent) | TBM LCA / BusinessWire |

Note: "40% LIMEX" = 40% of the LIMEX *compound* in the blend, **not** 40% calcium carbonate. The PE78-02M compound is itself ~78% CaCO₃, so the finished part is ~31% limestone.
