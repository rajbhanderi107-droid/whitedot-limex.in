# ⚙️ CEREBELLUM — Backend & Server Coordination

> Motor control. Backend logic, server systems, database coordination.

← Back to [[🧠 BRAIN-CORTEX]]

---

## 🖥️ Backend Structure

```
whitedot-backend/
  server/
    src/
      routes/
        auth.ts       ← Login, logout, Google OAuth
        public.ts     ← Settings, health
        admin/        ← CRM routes (JWT protected)
      prisma/
        schema.prisma ← Database schema
      middleware/
        auth.ts       ← JWT verification
    package.json
```

---

## 🗄️ Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `User` | Admin accounts (email + password hash) |
| `SiteSettings` | Key-value store for website config |
| `Lead` | Inquiry form submissions |
| `ContactRequest` | Trial/quote requests |

---

## 🔐 Auth Flow

```
Email/Password:
  POST /api/auth/login → verify bcrypt → sign JWT → return token

Google OAuth:
  GET /api/auth/google/config → {clientId}
  Frontend opens popup → Google returns code
  POST /api/auth/google/callback → exchange code → verify email → sign JWT

JWT:
  Stored in localStorage key: wd_admin_token
  Header: Authorization: Bearer <token>
  All /api/admin/* routes require valid JWT
```

---

## 🤖 LLM Chat

- Provider: Groq (OpenAI-compatible)
- Model: `llama-3.3-70b-versatile`
- Base URL: `https://api.groq.com/openai/v1`
- Key: `LLM_API_KEY` (Render env, sync:false)
- Fallback: graceful "unavailable" if key unset

---

← [[🤝 PARIETAL-LOBE]] | → [[🌱 BRAINSTEM]]
