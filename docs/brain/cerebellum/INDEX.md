# ⚙️ CEREBELLUM — Backend & Server

> Backend architecture, Prisma schema, server logic.

## Files
- [ARCHITECTURE.md](ARCHITECTURE.md) — Backend architecture overview
- `server/README.md` — Server setup guide (in server/)
- `server/prisma/schema.prisma` — Database schema

## Server Structure
```
server/
  src/
    routes/     ← auth, public, admin
    middleware/ ← JWT verification
    utils/      ← helpers
    validators/ ← input validation
  prisma/
    schema.prisma
    seed.ts
```

← [Brain Cortex](../../obsidian/🧠%20BRAIN-CORTEX.md)
