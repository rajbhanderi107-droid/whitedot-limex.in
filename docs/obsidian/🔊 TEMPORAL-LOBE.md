# 🔊 TEMPORAL LOBE — Memory & History

> Language, memory, project history. What happened and when.

← Back to [[🧠 BRAIN-CORTEX]]

---

## 📜 Changelog

### 2026-06-01
- Auto-debug hook added to global + project settings
- Obsidian brain dome created
- Obsidian Git plugin set to 1-min sync

### 2026-05-31
- 5 technical fixes deployed:
  - Fix 1: siteSettings.ts → correct backend URL
  - Fix 2: pages.yml VITE_API_URL updated
  - Fix 3: render.yaml CORS + FRONTEND_URL + SMTP_FROM
  - Fix 4: keep-alive.yml (10-min backend ping)
  - Fix 5: og-cover.svg added, OG meta tags fixed
- Obsidian vault created in docs/obsidian/

### 2026-05-29
- GCP old secret (****i7yN) deleted, only ****2Jaz remains
- OAuth URL mismatch resolved (pages.yml → whitedot-backend)
- Inquiry form wired to backend

### 2026-05-28
- Site went live on whitedotindia.in
- GitHub Pages + GoDaddy DNS configured
- Admin panel built (login + dashboard + CRM)

---

## 🐛 Bug Log

| Date | Bug | Fix | Status |
|------|-----|-----|--------|
| 2026-05-31 | CORS blocked whitedotindia.in | Added to FRONTEND_ORIGINS | ✅ Fixed |
| 2026-05-31 | Backend cold starts (60s) | keep-alive.yml added | ✅ Fixed |
| 2026-05-31 | OG image broken (%BASE_URL% bug) | Absolute URL used | ✅ Fixed |
| 2026-05-29 | OAuth failing silently | Wrong client secret in Render | ✅ Fixed |

---

← [[👁️ OCCIPITAL-LOBE]] | → [[🤝 PARIETAL-LOBE]]
