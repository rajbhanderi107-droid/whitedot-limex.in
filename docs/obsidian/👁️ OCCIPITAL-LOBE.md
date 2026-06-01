# 👁️ OCCIPITAL LOBE — Design & Visuals

> The visual cortex. Design system, UI rules, brand identity, motion.

← Back to [[🧠 BRAIN-CORTEX]]

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Canvas | `#050706` (dark, non-negotiable) |
| Accent dot | `#9aa893` (off-white mineral) |
| Text | `#f5f1e8` |
| Mono | JetBrains Mono |
| Serif | Boska (Indian Type Foundry) |
| Sans | Satoshi |

---

## 🌑 Brand Identity

- **Mark:** Single white dot = one grain of limestone = the raw material
- **Feeling:** Apple-clean + Aesop-mineral + Linear-precision
- **NOT:** Neon, cyberpunk, glassmorphism overload, cheap gradients
- **Motion:** Smooth, purposeful, scroll-aware, never distracting

---

## ✨ Active Visual Systems

### Aggregation Sequence (✅ Live)
- Inline critical CSS in `<head>` (renders pre-JS)
- Limestone dot breathes → ring fills → disperses into UI
- Hard cap: 4s max
- Returning visitors: 400ms fade only (cookie `wd_returning=1`)

### Mineral Sound System (🔧 Building)
- 4 cues: `stone-tap`, `settle`, `confirmation`, `continuity`
- Default MUTED — footer toggle → localStorage `wd_audio`
- Kill switch: `VITE_WD_AUDIO_ENABLED=false`

### Continuity Layer (🔧 Building)
- Offline overlay — dot + orbiting arcs + cycling text
- Form persistence to localStorage on disconnect
- WhatsApp reopens with saved fields on reconnect

---

## 📁 Asset Locations

```
public/assets/
  og-cover.svg          ← Social card (whitedotindia.in)
  whitedot-logo-enhanced.svg
  adobe/                ← Adobe Creative assets
  images/
  videos/
  models/               ← 3D models
```

---

← [[🎯 FRONTAL-LOBE]] | → [[🔊 TEMPORAL-LOBE]]
