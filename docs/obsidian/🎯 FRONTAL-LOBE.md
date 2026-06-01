# 🎯 FRONTAL LOBE — Planning & Decisions

> The executive brain. Strategy, goals, architecture decisions, roadmap.

← Back to [[🧠 BRAIN-CORTEX]]

---

## 🏗️ Architecture Decisions

- **Frontend:** Vite + React 19 + TypeScript (dark mode, #050706)
- **Backend:** Node.js + Prisma + PostgreSQL on Render (free tier, Singapore)
- **Auth:** Email+password + Google OAuth (JWT in localStorage, not cookies)
- **Hosting:** GitHub Pages → whitedotindia.in (GoDaddy DNS)
- **Brand voice:** Direct, mineral, procurement-grade English. Never breezy.

---

## 🌍 Territory & Context

- **Company:** WhiteDot LLP (sister of Sevendot)
- **Territory:** Gujarat, Rajasthan, Daman, Diu, Silvassa
- **LIMEX story:** CO2 → Calcium Carbonate → LIMEX → Plastic/Paper Replacement → FMCG → Sustainability → Premium Material Innovation
- **Audience:** Real clients, investors, industry partners, civil engineering companies, FMCG brands

---

## 🗺️ Roadmap

### ✅ Done
- [x] Live site on whitedotindia.in
- [x] Backend on whitedot-limex-backend.onrender.com
- [x] Google OAuth working
- [x] Admin panel (login, dashboard, CRM pages)
- [x] Inquiry form wired
- [x] 5 technical fixes deployed (API URL, CORS, OG image, keep-alive)
- [x] Aggregation Sequence (loader VFX)

### 🔧 In Progress
- [ ] Mineral Sound System (4 audio cues)
- [ ] Continuity Layer (offline overlay + form persistence)

### 💡 Planned
- [ ] Google Dashboard (GA4 + Search Console + Ads)
- [ ] Quote/sample/calculator frontend forms
- [ ] LIMEX product pages
- [ ] Client presentation mode

---

## 🧠 Thinking Log

> Add key decisions here with date.

| Date | Decision | Why |
|------|----------|-----|
| 2026-05-29 | GCP old secret deleted | Security — only one active secret |
| 2026-05-31 | CORS updated to whitedotindia.in | Live domain wasn't in CORS origins |
| 2026-06-01 | Auto-debug hook added | Catch errors automatically |

---

← [[🧠 BRAIN-CORTEX]] | → [[👁️ OCCIPITAL-LOBE]]
