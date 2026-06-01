# 🤝 PARIETAL LOBE — Data Flow & Integrations

> Sensory processing. How data moves through the system.

← Back to [[🧠 BRAIN-CORTEX]]

---

## 🔄 Data Flow Map

```
User (whitedotindia.in)
        │
        ▼
  React Frontend (GitHub Pages)
        │  VITE_API_URL
        ▼
  whitedot-limex-backend.onrender.com
        │
   ┌────┼────┐
   ▼    ▼    ▼
 Auth  CRM  Public API
  │     │       │
  ▼     ▼       ▼
 JWT  Prisma  Settings
       │
       ▼
  PostgreSQL (Render, Singapore)
```

---

## 🔌 API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/login` | Email + password → JWT |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Verify token |
| GET | `/api/auth/google/config` | Return `{enabled, clientId}` |
| POST | `/api/auth/google/callback` | Google OAuth exchange |
| GET | `/api/public/settings` | Site settings (public) |
| GET | `/health` | Backend health check |

---

## 🌐 External Integrations

| Service | Purpose | Key Location |
|---------|---------|-------------|
| Google OAuth | Admin login | GCP Console → client `689571813571-...` |
| Google Analytics | Traffic | GA4 (pending dashboard) |
| Google Search Console | SEO | Pending dashboard |
| Render | Backend hosting | Dashboard → whitedot-limex-backend |
| GoDaddy | DNS | whitedotindia.in |
| GitHub | Source + Pages | rajbhanderi107-droid/whitedot-limex.in |
| Groq | LLM chat | `llama-3.3-70b-versatile` (free tier) |

---

## 🔑 Env Vars Reference

### Frontend (Vite)
```
VITE_API_URL=https://whitedot-limex-backend.onrender.com
```

### Backend (Render)
```
DATABASE_URL        → from Render Postgres
JWT_SECRET          → auto-generated
FRONTEND_URL        → https://whitedotindia.in
FRONTEND_ORIGINS    → https://whitedotindia.in,https://www.whitedotindia.in,...
GOOGLE_CLIENT_ID    → GCP
GOOGLE_CLIENT_SECRET → GCP (never in code)
SMTP_FROM           → White Dot <no-reply@whitedotindia.in>
LLM_API_KEY         → Groq
```

---

← [[🔊 TEMPORAL-LOBE]] | → [[⚙️ CEREBELLUM]]
