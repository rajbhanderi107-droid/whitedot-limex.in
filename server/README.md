# WhiteDot Backend

Production backend for the WhiteDot / LIMEX website — CRM, lead management, quote workflows, sample tracking, and admin dashboard.

## Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 5
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod
- **Auth:** JWT with secure HTTP-only cookies

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run database migrations
npm run prisma:migrate

# 5. Seed the admin user
npm run seed

# 6. Start development server
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `PORT` | No | Server port (default: 4000) |
| `NODE_ENV` | No | development / production |
| `FRONTEND_URL` | No | CORS origin (default: http://localhost:5173) |
| `ADMIN_SEED_EMAIL` | For seed | Admin email for initial user |
| `ADMIN_SEED_PASSWORD` | For seed | Admin password for initial user |

## API Routes

### Public (rate-limited)
- `POST /api/public/inquiry` — Contact form
- `POST /api/public/quote-request` — LIMEX quote request
- `POST /api/public/sample-request` — Sample request
- `POST /api/public/calculator-submission` — Calculator results

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Admin (auth required)
- `GET /api/dashboard` — Dashboard stats
- `/api/inquiries` — CRUD
- `/api/quote-requests` — CRUD
- `/api/sample-requests` — CRUD
- `/api/companies` — CRUD
- `/api/calculator-submissions` — List + convert to lead
- `/api/follow-ups` — CRUD
- `/api/documents` — CRUD
- `/api/website-settings` — Read + update
- `/api/users` — SUPER_ADMIN only
- `/api/notifications` — User notifications
- `/api/activity-log` — Audit trail

## Database Models

User, Company, Inquiry, QuoteRequest, SampleRequest, CalculatorSubmission, AdminNote, FollowUpTask, DocumentAsset, WebsiteSetting, ActivityLog, Notification

## Deployment

### Recommended Stack
- **Backend hosting:** [Railway](https://railway.app) (auto-detects Node, free tier available)
- **Database:** [Neon](https://neon.tech) or [Supabase](https://supabase.com) — both provide free PostgreSQL

### Railway Deployment (Step-by-Step)

1. **Create a Neon/Supabase PostgreSQL database** and copy the connection string.

2. **Push this repository to GitHub** after the frontend/backend merge is verified.

3. **Create a new Railway project**, connect to the GitHub repo.

4. **Set environment variables** in Railway dashboard:
   ```
   DATABASE_URL=postgresql://...   # from Neon/Supabase
   JWT_SECRET=<64-char-random-string>
   NODE_ENV=production
   PORT=4000
   FRONTEND_URL=https://rajbhanderi107-droid.github.io
   ADMIN_SEED_EMAIL=raj@whitedot.in
   ADMIN_SEED_PASSWORD=<strong-password>
   ```

5. **Set the start command** in Railway:
   ```
   npm run build && npm run prisma:migrate:deploy && npm run seed && npm run start
   ```
   > The seed script is idempotent — safe to run on every deploy (skips if admin already exists).

6. **Get your Railway URL** (e.g. `https://whitedot-backend-production.up.railway.app`) and set it as `VITE_API_URL` in the frontend `.env.production`.

### Frontend Environment

Create `whitedot-limex.in/.env.production`:
```
VITE_API_URL=https://whitedot-backend-production.up.railway.app
```

Then rebuild and deploy to GitHub Pages.

### Generating a Strong JWT Secret

```bash
# Node.js one-liner
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Production Checklist

- [ ] `NODE_ENV=production` is set
- [ ] `JWT_SECRET` is at least 64 characters, randomly generated
- [ ] `FRONTEND_URL` matches the exact GitHub Pages domain (no trailing slash)
- [ ] `DATABASE_URL` uses SSL (Neon/Supabase provide this by default)
- [ ] `ADMIN_SEED_PASSWORD` is strong (12+ chars, mixed case + symbols)
- [ ] Database migrations ran without errors
- [ ] `GET /api/health` returns `{ "status": "ok" }` after deploy
- [ ] Login works at `https://your-frontend/#/admin/login`

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot-reload |
| `npm run build` | Compile TypeScript |
| `npm run start` | Start production server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run DB migrations (dev) |
| `npm run prisma:migrate:deploy` | Run DB migrations (prod) |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run seed` | Seed admin user + settings |
