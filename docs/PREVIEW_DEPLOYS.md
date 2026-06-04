# Preview Deploys (Cloudflare Pages — Git integration)

Get a **shareable preview URL** for every branch / pull request so you can see
work-in-progress online (openable from your phone) before it reaches the live
site at https://whitedotindia.in.

- **Live / production** → https://whitedotindia.in (GitHub Pages, fronted by Cloudflare DNS/CDN — unchanged)
- **Preview** → `https://<hash>.<project>.pages.dev` (Cloudflare Pages, auto-built from this repo)

## Recommended: connect the repo in the Cloudflare dashboard

Because Cloudflare already serves as the DNS/CDN for `whitedotindia.in`, the
simplest path is Cloudflare's built-in Git integration — **no GitHub secrets,
no workflow file needed.** Cloudflare builds every push and every PR itself.

### Steps (one-time, ≈3 minutes)
1. Go to https://dash.cloudflare.com → **Workers & Pages**.
2. **Create → Pages** tab → **Connect to Git**.
3. Authorize GitHub and select the repo **`whitedot-limex.in`**.
4. Build settings:
   - **Framework preset:** None (or Vite)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variable:** `VITE_API_URL = https://whitedot-limex-backend.onrender.com`
5. **Save and Deploy.**

That's it. From now on:
- Each **push** builds a deployment.
- Each **pull request** gets its own preview URL, posted automatically by
  Cloudflare as a check/comment on the PR.

### Important
- **Do not** point the production custom domain (`whitedotindia.in`) at this
  Pages project unless you intend to move hosting off GitHub Pages. Leaving it
  alone means this only *adds* preview links; production is untouched.
- `public/_redirects` (committed) gives the SPA correct client-side routing on
  Cloudflare previews (e.g. `/admin`). GitHub Pages ignores that file, so
  production is unaffected.

---

## Alternative: deploy via GitHub Actions + API token
If you prefer GitHub Actions to drive the deploy instead of Cloudflare's Git
integration, create a Pages project named `whitedot-limex`, add repo secrets
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, and add a workflow that runs
`cloudflare/wrangler-action@v3` with `pages deploy dist --project-name=whitedot-limex`.
The Git-integration route above is simpler and is recommended.
