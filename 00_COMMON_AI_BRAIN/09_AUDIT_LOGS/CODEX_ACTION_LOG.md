
## 2026-09-07 — Shared book improvements

User requested improvements to all three standalone books and the shared portal, a Days layout based on their screenshots, deletion controls, and transfer of screenshot visits.

Changes: shared Days record controls and company removal with Undo; private JSON visit import with preview, explicit date, current-note preservation and India timestamps; standalone sign-in/recovery routing; mobile order cards; lead/customer filters and search; shared toast feedback; order validation and pending-write protection.

The backend already supplies import and day-row deletion on master (27d040c); no backend or deployment configuration changed. Customer notes and screenshot-derived visit data remain outside the public repository. Actual visit date and authenticated portal access are required before applying the records. No production data was imported during this change.

Validation: TypeScript and production Vite build passed. Browser checks recorded in the PR description.

## 2026-09-07 — Clean LIMEX workspace

User requested removal of sidebar clutter and practical improvements centred on the three books. Reconciled origin/main dfdd315 with earlier reviewed book improvements, preserving customer-to-lead navigation and current backend API types. Replaced the crowded home dashboard with a live book desk: follow-ups due, open trials, confirmed orders to dispatch, and delivered orders to check for payment. Added search, phone links and direct company navigation. Sidebar now contains Today and the three LIMEX books; settings and automation controls are in a compact Tools menu. Other page routes remain available. No deployment settings or production data changed. Validation is recorded in the PR.

## 2026-09-07 — Approved production release

User explicitly requested making the improved portal live. Added an India-date heading and manual live refresh to the daily desk. Releasing PR #96 through the existing Hostinger deployment workflow after validation. No private visit records are included in this frontend release.

## 2026-09-19 — Product-first manufacturer books

User requested simpler employee workflows across all books, product filters, manufacturer-only opaque/milky-white prospects, and actual product photographs. Implemented shared product categories, evidence profiles and photo galleries/editor, an evidence-required default Route Book, separate review/outside-target views, saved product filters, smaller company pages and progressive disclosure of advanced controls. Leads, visits and customer orders remain intact. Source-folder counts now reflect their book. Existing Claude/Team provenance is preserved.

Checked public manufacturer/product sources for Proton Polymer, Balahanuman, Euphoria Packaging, Moldking and Satguru; included source links and check dates. Prepared three duplicate-aware GPT additions: P. M. Plastic Industries (Chandrala), Hifi Plastic Toys Industry (Kuha), and Anjali Polyplast (Khopoli, explicitly outside Gujarat). These are catalogue-evidence matches, not factory audits or LIMEX compatibility approvals. No unsupported product photographs or synthetic images are used. Unknown records are not labelled verified.

Backend companion adds a nullable, validated productProfile field and additive SQL migration; backend TypeScript check passed. Frontend TypeScript/Vite build and qualification regression checks passed. Publishing through existing deployment workflows; no environment/domain/deployment-setting changes. Authenticated insertion and live verification are performed after deployment and recorded separately.


### Release verification

Frontend 6224592 and backend 2019c52 / ca3f4c4 deployed successfully through the existing workflows; backend health check passed. Research additions applied as an atomic, duplicate-aware migration, preserving existing source folders and non-null employee profiles. Migration was tested on PostgreSQL for repeat execution, existing-name matches, source preservation and untouched visit/customer fields. A frontend update ensures history/pipeline views reset prospect-only filters and unclear records appear in review. Proton photo links replaced using its alternate official catalogue after the original image CDN rejected requests. Two other supplier CDN photos may still be unavailable; galleries show a clear source fallback. Browser sign-in returned a server-connection error, so authenticated visual verification is still pending. No claim of factory audit or LIMEX compatibility is made.


## 2026-09-20 — Continued manufacturer review

Resumed the user's product-only manufacturer review. Added a profile for the existing Umasree record, restricted to opaque PP woven sacks (company catalogue and in-house extrusion/weaving evidence). Recorded Nirmal's manufacturer evidence but kept opacity unknown and no photos: the current site uses general imagery, so this record remains Needs checking. Replaced only our prior blocked Balahanuman photo with a working black LLDPE bag image from its own catalogue. Did not add the HM-bag trader Shri Krishna Plastics. P. M. Plastic's original supplier photo still requires a reliable replacement; the whole register has not been factory-verified.

Public images were downloaded and visually inspected. PostgreSQL-compatible regression check passed: repeated migration creates no duplicate marks, respects employee profile overrides, changes only the matched photo, and preserves notes, stage and source folder. Released backend commit b395fccea7ff9356300345416910c1ee97da610b through the existing workflow. Browser authentication was no longer retained at resumption; live checks are pending secure sign-in. No environment or deployment settings changed.
