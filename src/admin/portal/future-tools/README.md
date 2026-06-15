# Future Tools — parked portal features

Features removed from the **live** portal but kept here intact for future use.
Nothing in this folder is routed or shown in the portal until you re-wire it.

---

## AI Growth Studio  (removed 2026-06-15)

The "AI Growth Studio" module group + its 8 config-driven AI tools
(3D Web Studio, Conversion Audit, SEO Pipeline, UGC Script Engine,
Leverage Auditor, Productize Blueprint, Time–Money Leak Detector,
Algo Trading Research).

### Files kept here
- `aiTools.ts` — frontend tool registry (`AI_TOOLS`, `AI_TOOLS_BY_KEY`).
- `AiToolPage.tsx` — generic config-driven page that renders any tool by key.

### Still in the live tree (left untouched, harmless when unrouted)
- `server/src/services/aiTools.ts` — server prompt registry.
- `portalApi.aiTool(...)` in `src/admin/portal/portalApi.ts` — the API call.
- `/api/portal/ai/tool` backend route.
- The `.wd-tool-*` styles in `src/admin/portal/portal.css`.

### To re-enable

1. **Move both files back** to their original locations:
   - `future-tools/aiTools.ts` → `src/admin/portal/aiTools.ts`
   - `future-tools/AiToolPage.tsx` → `src/admin/portal/pages/AiToolPage.tsx`
   - In `AiToolPage.tsx`, change the import back: `./aiTools.js` → `../aiTools.js`

2. **Re-add the module group** in `src/admin/portal/modules.ts` (inside the
   `MODULE_GROUPS` array, e.g. after the "Marketing & Growth" group):

   ```ts
   {
     title: "AI Growth Studio",
     modules: [
       { key: "web3d-studio", label: "3D Web Studio", icon: Boxes, path: "/admin/studio/web3d-studio", status: "live",
         blurb: "Brief immersive Three.js / scroll-driven websites — a premium client service.",
         features: ["Scene-by-scene 3D breakdown", "R3F technical + performance plan", "Section copy direction", "Ordered build sequence"] },
       { key: "conversion-audit", label: "Conversion Audit", icon: Gauge, path: "/admin/studio/conversion-audit", status: "live",
         blurb: "Senior CRO analyst that finds conversion bottlenecks in 24 hours.",
         features: ["Friction & leak map", "Prioritized fixes (impact × effort)", "Highest-ROI change first", "A/B test ideas"] },
       { key: "seo-pipeline", label: "SEO Pipeline", icon: Search, path: "/admin/studio/seo-pipeline", status: "live",
         blurb: "One keyword → a 15+ article topical-authority plan with linking map.",
         features: ["Pillar + cluster plan", "Internal linking map", "Top-3 outlines + meta", "AI-overview optimization"] },
       { key: "ugc-engine", label: "UGC Script Engine", icon: Clapperboard, path: "/admin/studio/ugc-engine", status: "live",
         blurb: "Reverse-engineer winning ads → batches of word-for-word creator scripts.",
         features: ["Hook & pacing teardown", "Reusable script template", "Batch of creator scripts", "Per-platform captions"] },
       { key: "leverage-auditor", label: "Leverage Auditor", icon: Scale, path: "/admin/studio/leverage-auditor", status: "live",
         blurb: "Naval's 4-lever audit — find leverage leaks and the 3 moves to fix them.",
         features: ["Labor / capital / code / media map", "Leverage Index score", "Biggest leverage leak", "3 upgrade moves + 30-day move"] },
       { key: "productize-blueprint", label: "Productize Blueprint", icon: Rocket, path: "/admin/studio/productize-blueprint", status: "live",
         blurb: "Turn expertise into a product that sells without your live presence.",
         features: ["Core transformation statement", "3 scored product formats", "Winning product structure", "Week-1 launch roadmap"] },
       { key: "time-money-leak", label: "Time–Money Leak Detector", icon: Hourglass, path: "/admin/studio/time-money-leak", status: "live",
         blurb: "Expose hours rented instead of invested — and the escape path to equity.",
         features: ["Time-rent vs equity audit", "Time-rent ratio", "Top 3 equity conversions", "24-month equity-gap projection"] },
       { key: "algo-research", label: "Algo Trading Research", icon: LineChart, path: "/admin/studio/algo-research", status: "beta",
         blurb: "Design & backtest-plan systematic strategies — research only, human in the loop.",
         features: ["Strategy hypothesis & rules", "Monte-Carlo backtest plan", "Risk controls", "Overfitting warnings (not financial advice)"] },
     ],
   },
   ```
   (All required icons — `Boxes, Gauge, Search, Clapperboard, Scale, Rocket, Hourglass, LineChart` — are already imported in `modules.ts`.)

3. **Re-add the routes** in `src/admin/AdminApp.tsx`:

   ```tsx
   // imports
   import { AiToolPage } from "./portal/pages/AiToolPage.js";
   import { AI_TOOLS } from "./portal/aiTools.js";

   // inside <Routes>, near the other /admin routes
   {/* ── AI Growth Studio tools (config-driven) ── */}
   {AI_TOOLS.map((t) => (
     <Route key={t.key} path={`/admin/studio/${t.key}`} element={<AiToolPage moduleKey={t.key} />} />
   ))}
   ```

That's it — the group, its 8 tool pages and routes come back exactly as before.
