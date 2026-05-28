# WhiteDot Backend Architecture

This repository uses one backend package under `server/`.

## Merge Shape

- `whitedot-backend` is the source of truth for CRM models, Prisma schema, admin controllers, public form controllers, auth, follow-ups, notifications, documents, and activity logs.
- `whitedot-cdc-backend` contributed the production hardening pattern: explicit health route, proxy trust, compression, request logging, stricter CORS options, and frontend-repo `server/` layout.
- Duplicate route/controller concepts are intentionally not kept twice. Add new backend behavior as a focused controller, route, validator, and service inside this one `server/` package.

## Frontend Contract

- Public website routes stay in the main Vite app.
- Admin frontend routes live under `#/admin/...`.
- The admin host target is `https://admin.whitedot-limex.in`.
- Frontend API calls use `VITE_API_URL`.
- Backend CORS uses `FRONTEND_URL`.

## Add Later

- New database entities: update `prisma/schema.prisma`, run `npm run backend:prisma:generate`, then add validators/controllers/routes.
- New admin screens: add pages under `src/admin/pages` and register routes in `src/admin/AdminApp.tsx`.
- New public form endpoints: add validators in `server/src/validators/public.validator.ts`, controller logic in `server/src/controllers/public.controller.ts`, and route wiring in `server/src/routes/public.routes.ts`.
