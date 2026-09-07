
## 2026-09-07 — Shared book improvements

User requested improvements to all three standalone books and the shared portal, a Days layout based on their screenshots, deletion controls, and transfer of screenshot visits.

Changes: shared Days record controls and company removal with Undo; private JSON visit import with preview, explicit date, current-note preservation and India timestamps; standalone sign-in/recovery routing; mobile order cards; lead/customer filters and search; shared toast feedback; order validation and pending-write protection.

The backend already supplies import and day-row deletion on master (27d040c); no backend or deployment configuration changed. Customer notes and screenshot-derived visit data remain outside the public repository. Actual visit date and authenticated portal access are required before applying the records. No production data was imported during this change.

Validation: TypeScript and production Vite build passed. Browser checks recorded in the PR description.

## 2026-09-07 — Clean LIMEX workspace

User requested removal of sidebar clutter and practical improvements centred on the three books. Reconciled origin/main dfdd315 with earlier reviewed book improvements, preserving customer-to-lead navigation and current backend API types. Replaced the crowded home dashboard with a live book desk: follow-ups due, open trials, confirmed orders to dispatch, and delivered orders to check for payment. Added search, phone links and direct company navigation. Sidebar now contains Today and the three LIMEX books; settings and automation controls are in a compact Tools menu. Other page routes remain available. No deployment settings or production data changed. Validation is recorded in the PR.
