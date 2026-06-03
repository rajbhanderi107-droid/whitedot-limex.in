# Quality Control Checklist — BORN OF LIMEX

## Timing
- [x] 8 scenes, contiguous 0:00 -> 0:40, no gaps/overlaps (validated in ad-timeline.json)
- [x] Durations sum to exactly 40.0s
- [ ] Final cut measures 40.0s on export

## Continuity
- [ ] Material look consistent across S1, S4, S5, S7
- [ ] Light direction continuous across each transition
- [ ] Transitions material-motivated (no template wipes)
- [ ] Hand (S4) realistic — no extra fingers, no morph

## Brand
- [ ] Palette holds (#181b19 / #f6f7f4 / #f5f1e8 / #9aa893), no neon/oversaturation
- [ ] Type is Boska (display) + Satoshi; lockup correct "WHITEDOT x LIMEX"
- [ ] Logos crisp (tbm-logo.png / limex-wordmark.png) at close

## Brand-safety (factual)
- [ ] No "carbon-negative", "100% biodegradable", or "made from CO2" as fact
- [ ] Language stays "mineral-based / reduces plastic dependence / responsible pathway"
- [ ] TBM credited (developer/manufacturer, Japan); WhiteDot = marketing & sales

## Prompt usability
- [ ] Each scene has image + video + negative prompts that run as-is
- [ ] Kling-first / Firefly-first steps verified

## Formats & a11y
- [ ] 16:9 master (1080p + 4K) exported
- [ ] 9:16 cut, text in vertical safe area
- [ ] Captions/subtitles file for VO
- [ ] Audio -14 LUFS, true peak <= -1 dBTP

## Sign-off
| Role | Name | Status |
|---|---|---|
| Director | | |
| Brand (WhiteDot) | | |
| Final master | | |

---

## Automated QC Pass — 2026-06-02 (rewritten)
- Files present: **24/24** in ads/born-of-limex-40s/.
- ad-timeline.json: valid JSON, 8 scenes, contiguous 0->40, durations sum **40.0s**. PASS.
- Cross-doc: shot-list + EDL both total 40.0s on the same 8 boundaries. PASS.
- Overclaims scan: none found — grounded mineral/reduction language throughout. PASS.
- Note: clip/still generation is manual (no free generator wired in-tool). Kling free tier = primary; Adobe Firefly web = preferred; Adobe connector used for finishing (resize/grade/quick-cut).
- Verdict: **PASS** — package complete; assets to be generated per production-workflow.md.
