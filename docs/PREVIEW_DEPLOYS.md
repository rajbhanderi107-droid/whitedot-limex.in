# Preview Deploys (Cloudflare Pages)

Every pull request gets its own **shareable preview URL** so you can see your
work-in-progress online (openable from your phone) before it goes to the live
site at https://whitedotindia.in.

- **Live / production** (`main` branch) → https://whitedotindia.in (via `pages.yml`)
- **Preview** (any pull request) → `https://<branch>.whitedot-limex.pages.dev` (via `preview.yml`)

The preview link is posted automatically as a comment on each PR and updates on
every push to that branch.

---

## One-time setup (≈5 minutes)

You only need to do this once. After that, previews are fully automatic.

### 1. Create a free Cloudflare account
Go to https://dash.cloudflare.com/sign-up (free plan is enough).

### 2. Create the Pages project
1. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git** (or "Direct Upload").
2. Name the project exactly **`whitedot-limex`** (this must match `--project-name` in `.github/workflows/preview.yml`).
3. If asked for build settings you can leave them blank — GitHub Actions builds and uploads the site for us.

### 3. Get your Account ID
- Dashboard → **Workers & Pages** → right sidebar shows **Account ID**. Copy it.

### 4. Create an API token
1. https://dash.cloudflare.com/profile/api-tokens → **Create Token**.
2. Use the **"Edit Cloudflare Workers"** template, **or** create a custom token with permission:
   - **Account → Cloudflare Pages → Edit**
3. Copy the generated token (shown once).

### 5. Add the two secrets to GitHub
In the repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | the API token from step 4 |
| `CLOUDFLARE_ACCOUNT_ID` | the Account ID from step 3 |

That's it. Open (or re-push) a pull request and the **Preview deploy** workflow
will build the site and comment the live preview link on the PR.

---

## Notes
- Production deploys (`whitedotindia.in`) are unaffected — they still come only
  from `main` via `pages.yml`.
- `public/_redirects` gives the SPA proper client-side routing on previews
  (e.g. `/admin`). GitHub Pages ignores that file, so production is unchanged.
- Project name, branch, and API base URL can be adjusted in
  `.github/workflows/preview.yml`.
