# WhiteDot LIMEX Website

Premium single-page website for WhiteDot LIMEX / CR LIMEX regional distribution and education across Gujarat, Rajasthan, Diu, Daman, and Goa.

**Built with:** React, TypeScript, Three.js, Vite

## Design system

The Claude Design handoff is merged into `public/design-system/`:

- `/design-system/` - entry point for the implemented designs
- `/design-system/ui_kits/marketing-site/` - cinematic marketing-site recreation

The live app imports `src/brand-fonts.css`, which loads the design-system type stack: Satoshi, Boska, and JetBrains Mono. The latest handoff confirms White Dot is a website, not an app, so the previous procurement portal mock has been removed.

## Local development

```bash
npm install
npm run dev```

## Production build

```bash
npm run build
```
