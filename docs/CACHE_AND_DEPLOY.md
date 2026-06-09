# Deploy & cache — why a change may not show up immediately

The site is served through **two cache layers**:

```
Browser ──▶ Cloudflare (your DNS/CDN) ──▶ GitHub Pages (Fastly) ──▶ gh-pages branch
```

When you push to `main`, the `Deploy WhiteDot site to GitHub Pages` workflow
rebuilds `dist/` and force-pushes it to the `gh-pages` branch. GitHub Pages
serves it, and **Cloudflare caches the assets at its edge** (CSS/JS for up to
4 hours). That edge cache is the usual reason a fresh deploy "doesn't show up"
— the new files exist at the origin, but Cloudflare keeps serving the old ones
until their TTL expires.

## Automatic fix (already wired in)

`.github/workflows/pages.yml` has a **Purge Cloudflare cache** step that runs
after every successful deploy and clears the edge cache, so updates go live
right away. It **skips automatically** until you add the two secrets below —
so the deploy never fails just because the secrets aren't set.

## One-time setup — add the two secrets

1. **Get a Cloudflare API token**
   - Cloudflare dashboard → *My Profile* → *API Tokens* → *Create Token*
   - Use the **"Edit zone"** template (or a custom token with the
     **Zone → Cache Purge → Purge** permission), scoped to the
     `whitedotindia.in` zone.
   - Copy the generated token.

2. **Get your Zone ID**
   - Cloudflare dashboard → select the `whitedotindia.in` domain →
     *Overview* → right sidebar → **Zone ID**. Copy it.

3. **Add both as GitHub repository secrets**
   - GitHub repo → *Settings* → *Secrets and variables* → *Actions* →
     *New repository secret*:
     - `CLOUDFLARE_API_TOKEN` → the token from step 1
     - `CLOUDFLARE_ZONE_ID` → the Zone ID from step 2

Once both secrets exist, the next push to `main` will purge the cache
automatically and your change appears on `whitedotindia.in` within seconds.

## Seeing a change before the cache clears (manual)

- **Hard refresh:** `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
- **Incognito / private window**
- Append a dummy query: `https://whitedotindia.in/?v=2`
- **Purge everything manually:** Cloudflare dashboard → *Caching* →
  *Configuration* → *Purge Everything*

## Note on hashed assets

Vite fingerprints every JS/CSS file (e.g. `CinematicAppV2-BY5kMWLB.css`).
Because the filename changes whenever the content changes, the only file that
*must* be re-fetched after a deploy is `index.html`, which points at the new
hashed files. GitHub Pages serves `index.html` with a short 10-minute TTL, and
the Cloudflare purge above flushes it immediately.
