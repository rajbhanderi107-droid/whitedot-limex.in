# 🌱 BRAINSTEM — Infrastructure & Deployment

> CI/CD, GitHub Actions, Render config, DNS.

## Files
- [DEPLOYMENT.md](DEPLOYMENT.md) — Full deployment guide

## Live Config Files
- `.github/workflows/pages.yml` — Build + deploy frontend
- `.github/workflows/keep-alive.yml` — Backend ping every 10min
- `render.yaml` — Render service config
- `public/CNAME` — `whitedotindia.in`

## Deploy Flow
```
git push origin main → pages.yml → npm build → gh-pages → whitedotindia.in
```

← [Brain Cortex](../../obsidian/🧠%20BRAIN-CORTEX.md)
