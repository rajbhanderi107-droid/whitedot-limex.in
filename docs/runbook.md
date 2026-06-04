# Operations Runbook - Performance & Release Management

This runbook outlines performance budgets, release safety protocols, feature flags, and maintenance guidelines for the WhiteDot website.

---

## 1. Feature Flag & Kill-Switch Specifications

### Global Cinematic System Switch
- **Description**: Completely toggles the high-performance 3D canvas and video rendering layers on and off.
- **Control Vector**: React Context state gated by `usePremium()` under the `PremiumProvider`.
- **Canary / Override Switch**: Can be forced to `off` globally by setting the HTML attribute `data-premium="off"` on the root document element. This immediately neutralizes all dynamic web GL resources, custom scroll animation timelines, and looping video elements across the entire website.
- **Canary Rollout Path**: 
  1. Internal rollout (100% of staff, target query `?wd_show_admin=1` in URL to toggle visibility).
  2. Canary group (5% of users with simple fallback).
  3. Gradual rollout in 25% increments.

### Admin Panel Visibility Toggle
- **Description**: Displays or hides the admin access routes in the menu structure of the public landing page.
- **Toggle Parameter**: Add `?wd_show_admin=1` to the URL parameter list on `https://whitedotindia.in` to save the `wd_show_admin_button` key to the local storage, which renders the admin links. Add `?wd_show_admin=0` to hide them again.

---

## 2. Performance Budgets & CWV Thresholds

To maintain mythos-level smoothness and ensure a Lighthouse performance score `>= 90`, we assert the following budgets in CI:

| Telemetry Metric | Target (Good Zone) | Rollback Threshold (Red Zone) | Action on Breach |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | <= 2.5s | > 4.0s | Revert last commit / optimize poster sizes |
| **INP** (Interaction to Next Paint) | <= 200ms | > 500ms | Break long JS loops, optimize handlers |
| **CLS** (Cumulative Layout Shift) | <= 0.1 | > 0.25 | Clamp layout container aspects, fix late hydration |
| **Main-Thread Tasks** | <= 50ms | > 100ms | Split heavy chunk computations |
| **Animation Frame Pacing** | ~16.7ms | > 33.3ms (30fps drop) | Downgrade details to 2D poster fallback |
| **First-load JS size** | <= 350 kB | > 500 kB | Code-split libraries using dynamic import() |

---

## 3. Rollback Playbook & Response Procedures

If field monitoring (CrUX/RUM) or automated PR testing alerts are triggered:

### Emergency Rollback Steps
1. **Toggle Switch**: Set `<html data-premium="off">` to instantly drop the website into simple-mode (fades and static posters only), bypassing redeployments.
2. **Revert PR**: If code changes introduced memory leaks or layouts shifts, locate the PR ID and revert the merge:
   ```bash
   git revert -m 1 <merge-commit-hash>
   git push origin main
   ```
3. **Verify**: Ensure the automated build compiles and runs tests successfully.

---

## 4. Maintenance Guidelines for Future Developers

### Adding New Video / Image Assets
- **Bitrate Cap**: Background videos must never exceed a bitrate of `1.2 Mbps`.
- **Dimensions**: Clamp all background assets to `1920x1080` (or `1280x720` for below-fold items).
- **Posters**: Always supply a compressed `-poster.jpg` asset inside `public/assets/videos/`.

### Preventing Layout Shifts (CLS)
- **Placeholders**: Never push DOM elements dynamically without reserving exact aspect ratio heights using CSS or height wrappers.
- **Fonts**: Use `font-display: swap` and preload only the primary brand font to avoid layout recalculations during initial font swap.
