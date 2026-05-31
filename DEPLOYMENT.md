# DEPLOYMENT GUIDE — WHITE DOT LIMEX

> **Frontend:** GitHub Pages | **Backend:** Render (Singapore)
> **Repo:** rajbhanderi107-droid/whitedot-limex.in

---

## 1. Stack Overview

| Layer | Technology | Platform |
|-------|-----------|----------|
| Frontend | React 19 + TypeScript + Vite | GitHub Pages |
| Backend | Express + Prisma + PostgreSQL | Render (Singapore) |
| Auth | JWT | Backend |
| 3D/Motion | Three.js + GSAP + Framer Motion | Frontend |

---

## 2. Frontend Deployment (GitHub Pages)

```bash
npm run build
npm run preview
npm run deploy
```

### Required package.json scripts:
```json
{
  "scripts": {
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  },
  "homepage": "https://rajbhanderi107-droid.github.io/whitedot-limex.in"
}
```

---

## 3. Backend Deployment (Render Singapore)

1. Push backend to GitHub.
2. Connect Render to GitHub repo.
3. Set region: Singapore.
4. Set environment variables in Render dashboard.
5. Set start command: npm start or node dist/index.js.
6. Enable auto-deploy on push to main.

---

## 4. Environment Variables — Render Dashboard

```
DATABASE_URL=<your_neon_or_render_postgres_url>
JWT_SECRET=<your_secret>
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://whitedot-limex.in
```

---

## 5. Database (PostgreSQL + Prisma)

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db push
```

---

## 6. Pre-Deployment Checklist

- [ ] All `.env` files excluded from git
- [ ] npm run build runs without errors
- [ ] No console.log with sensitive data
- [ ] API CORS configured for production domain
- [ ] HTTPS enforced
- [ ] All images optimized (WebP)
- [ ] Lighthouse score > 90
- [ ] Mobile tested on real device
- [ ] 404 page configured

---

## 7. Domains

- Production: whitedot-limex.in
- Backend API: api.whitedot-limex.in (or Render subdomain)

## Last Updated
_Date: TBD_
