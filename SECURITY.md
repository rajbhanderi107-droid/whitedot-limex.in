# SECURITY POLICY — WHITE DOT LIMEX

> **Status:** Production | Read before any deployment.

---

## 1. Never Expose

| Item | Action |
|------|--------|
| API Keys | `.env.local` only |
| Database URLs | `.env.local` only |
| Claude API Key | `.env.local` only |
| OpenAI API Key | `.env.local` only |
| Gemini API Key | `.env.local` only |
| Adobe Credentials | `.env.local` only |
| GoDaddy Login | Never store in code |
| Vercel/Render Tokens | Deployment env vars only |
| JWT Secret | `.env.local` only |
| Payment Keys | `.env.local` only |

---

## 2. .gitignore Must Include

```
.env
.env.local
.env.production
.env.development
node_modules
.next
dist
build
.vercel
.DS_Store
*.pem
*.key
*.cert
```

---

## 3. Environment Variable Pattern

```bash
# .env.local (never commit)
DATABASE_URL=your_db_url_here
JWT_SECRET=your_jwt_secret_here
VITE_API_URL=https://api.yourdomain.com

# .env.example (commit this safe template)
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=your_jwt_secret_here
VITE_API_URL=https://api.yourdomain.com
```

---

## 4. If A Secret Is Found In Code

1. Stop immediately.
2. Do not proceed.
3. Rotate the exposed key immediately.
4. Remove from git history using git filter-branch or BFG Repo Cleaner.
5. Update all services using that key.

---

## 5. Input Validation

- Validate all form inputs on both frontend and backend.
- Sanitize inputs before DB queries.
- Use Prisma's parameterized queries (never raw SQL with user input).
- Rate-limit API endpoints.

---

## 6. JWT Policy

- Short-lived access tokens (15 min).
- Refresh token rotation enabled.
- Store tokens in httpOnly cookies, not localStorage.
- Never log tokens.

## Last Updated
_Date: TBD_
