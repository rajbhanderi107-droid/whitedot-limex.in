
## 2026-09-07 — Shared book improvements

User requested improvements to all three standalone books and the shared portal, a Days layout based on their screenshots, deletion controls, and transfer of screenshot visits.

Changes: shared Days record controls and company removal with Undo; private JSON visit import with preview, explicit date, current-note preservation and India timestamps; standalone sign-in/recovery routing; mobile order cards; lead/customer filters and search; shared toast feedback; order validation and pending-write protection.

The backend already supplies import and day-row deletion on master (27d040c); no backend or deployment configuration changed. Customer notes and screenshot-derived visit data remain outside the public repository. Actual visit date and authenticated portal access are required before applying the records. No production data was imported during this change.

Validation: TypeScript and production Vite build passed. Browser checks recorded in the PR description.
