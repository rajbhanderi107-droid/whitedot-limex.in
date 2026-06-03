# 🔐 AMYGDALA — Security Dome

> Fear and threat response. Security rules, vulnerabilities, alerts, hardening.

← Back to [[🧠 BRAIN-CORTEX]]

---

## 🛡️ Security Rules (Non-Negotiable)

- **NEVER** commit secrets (API keys, client secrets, DB URLs) to git
- **NEVER** expose `GOOGLE_CLIENT_SECRET` in frontend code
- **JWT** goes in `Authorization: Bearer` header — NOT cookies (cross-origin)
- **CORS** must explicitly list all allowed origins
- **One active GCP secret at a time** — delete old ones immediately after rotation

---

## 🔑 Secret Locations

| Secret | Where |
|--------|-------|
| `GOOGLE_CLIENT_SECRET` | Render env only (sync:false) |
| `JWT_SECRET` | Render env (auto-generated) |
| `DATABASE_URL` | Render env (from Postgres service) |
| `LLM_API_KEY` | Render env (sync:false) |
| `ADMIN_SEED_PASSWORD` | Render env (sync:false) |
| Claude OAuth tokens | `~/.claude/.credentials.json` (locked to rbhan only) |

---

## 🚨 Active Alerts

| Severity | Issue | Status |
|----------|-------|--------|
| ✅ Fixed | `.credentials.json` readable by CodexSandboxUsers | Locked 2026-06-01 |
| ✅ Fixed | Wrong GCP secret in Render | Rotated 2026-05-29 |

---

## 🤖 Auto-Debug Layer

- **Hook:** PostToolUse on Bash/PowerShell (global + project)
- **Trigger:** Non-zero exit code or non-empty stderr
- **Action:** Routes to debug-monster automatically
- **Scope:** All sessions globally + whitedot project

---

## 🔒 CORS Policy

Allowed origins:
```
https://whitedotindia.in
https://www.whitedotindia.in
https://rajbhanderi107-droid.github.io
https://admin.whitedotindia.in
```

---

← [[🌱 BRAINSTEM]] | → [[💾 HIPPOCAMPUS]]
