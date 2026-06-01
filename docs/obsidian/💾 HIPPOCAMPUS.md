# 💾 HIPPOCAMPUS — Long-Term Memory

> The memory consolidator. Lessons learned, permanent decisions, things never to forget.

← Back to [[🧠 BRAIN-CORTEX]]

---

## 🧠 Things Never To Forget

### Domain vs Repo Name
- **Live domain:** `whitedotindia.in` (GoDaddy)
- **Repo/folder name:** `whitedot-limex.in`
- They are **different**. Never confuse them.

### Google OAuth
- `redirect_uri` must be `"postmessage"` for popup-based OAuth
- Client ID is public. Client Secret is **never** in frontend code.
- Secret is shown only ONCE in GCP — copy immediately.

### JWT in Header, Not Cookie
- Cross-origin (GitHub Pages → Render) blocks cookies.
- Always: `Authorization: Bearer <token>` header.

### Render Cold Starts
- Free tier sleeps after inactivity.
- keep-alive.yml pings `/health` every 10 min.

### CORS Must Include Live Domain
- GitHub Pages URL is NOT the live URL.
- Always add `whitedotindia.in` explicitly.

---

## 🏛️ Architecture Decision Records

| ADR | Decision | Reason |
|-----|----------|--------|
| ADR-001 | React 19 + TS + Vite + Three.js + GSAP + Framer | Modern, fast, cinematic 3D, TypeScript safety |
| ADR-002 | GitHub Pages (FE) + Render Singapore (BE) | Cost-effective, performant for South Asia |
| ADR-003 | Apple-level minimal design, dark mode | Client-ready, trustworthy for B2B + investors |
| ADR-004 | Obsidian vault in docs/obsidian/ | All knowledge in version control, readable by Claude |
| ADR-005 | Dark canvas #050706 (not brief's #F7F5F1) | Site is dark; brief was overridden by implementation |
| ADR-006 | JWT in header, not cookie | Cross-origin GitHub Pages → Render blocks cookies |

---

## 📚 Lessons from Failures

| Incident | Root Cause | Lesson |
|----------|-----------|--------|
| OAuth failing silently | Wrong GCP secret after rotation | Delete old, verify new immediately |
| OG image broken | `%BASE_URL%` doesn't expand correctly | Use absolute URL for OG images |
| Backend unreachable | CORS missing whitedotindia.in | Update render.yaml on domain change |
| Cold start timeouts | Render free tier sleeps | Keep-alive workflow is mandatory |

---

## 🏛️ Architecture Principles

1. Mobile-first. iOS Safari is the binding constraint — QA there first.
2. Dark mode only (#050706). The design brief said light; we chose dark.
3. B2B voice: direct, mineral, procurement-grade. No emojis, no exclamations.
4. Every system must be killable via env var.
5. Every new system must be removable via `npm run remove:*`.
6. Secrets live in Render env only. Never in git.

---

← [[🔐 AMYGDALA]] | → [[⚡ NEURONS]]
