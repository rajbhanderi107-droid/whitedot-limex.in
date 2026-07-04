# Product File Rule

Every one of the 35 planned case-study products gets its own dedicated files — never shared blobs only.

For product `<slug>`:

1. **`public/case-study/data/products/<slug>.json`** — that product's full data record (composition, specs, model/html file paths, status). This is the single file an agent or script reads to know everything about one product.
2. **`docs/products/<slug>.md`** — human/agent-readable dossier: status, file locations, composition summary, TODO checklist.
3. **`public/case-study/model/<slug>*.glb`** — the 3D model, once built.
4. **`public/case-study/<slug>.html`** — the case-study page, once built (follow `bobbin.html` / `araldite-container.html` pattern).

`public/case-study/data/products.json` (master index) and `data/specs.json` (legacy combined specs, kept for the live pages' existing fetch calls) still exist and must stay in sync — but `data/products/<slug>.json` is now the canonical per-product source of truth going forward. When a product goes from `pending` to `live`, update all of: its own `products/<slug>.json`, `specs.json` (until the engine is migrated to read per-file), `products.json` status field, plus add the `.glb` and `.html`.

**Never invent LIMEX composition %, CO2 figures, or supplier specs.** Pending products stay honestly `"pending"` with `composition: null` until sourced from the official White Dot "LIMEX Case Studies in India" PDF or a verified supplier TDS — see [[feedback_limex_data_accuracy]].
