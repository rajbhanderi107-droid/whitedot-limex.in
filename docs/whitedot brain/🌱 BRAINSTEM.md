# 🌱 BRAINSTEM — Infrastructure & Deployment

> Life support. CI/CD, GitHub Actions, Render, DNS. The system that keeps everything alive.

← Back to [[🧠 BRAIN-CORTEX]]

---

## 🚀 Deploy Pipeline

```
git push origin main
        │
        ▼
.github/workflows/pages.yml
        │
        ├─ npm install
        ├─ npm run build (VITE_API_URL injected)
        └─ push dist/ → gh-pages branch
                │
                ▼
        GitHub Pages serves
                │
                ▼
        whitedotindia.in (GoDaddy DNS → GitHub IPs)
```

---

## 📋 GitHub Actions Workflows

| File | Purpose | Trigger |
|------|---------|---------|
| `pages.yml` | Build + deploy frontend | Push to main |
| `keep-alive.yml` | Ping backend `/health` | Every 10 min (cron) |

---

## 🌐 DNS Configuration (GoDaddy)

```
Type  Name  Value
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   rajbhanderi107-droid.github.io
```

`public/CNAME` = `whitedotindia.in`

---

## 🐳 Render Configuration (render.yaml)

- Service: `whitedot-limex-backend`
- Runtime: Node, free plan, Singapore region
- Build: `cd server && npm ci && prisma:generate && build`
- Start: `npx prisma db push && npm run seed && npm run start`
- Health: `/health`
- Auto-deploy: on push to main

---

## ⚠️ Known Constraints

- Render free tier → cold starts (mitigated by keep-alive.yml)
- GitHub Pages → static only, no SSR
- Free Render Postgres → 1GB limit, Singapore region

---

← [[⚙️ CEREBELLUM]] | → [[🔐 AMYGDALA]]
