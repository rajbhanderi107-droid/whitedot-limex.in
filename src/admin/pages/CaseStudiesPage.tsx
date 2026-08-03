import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Save, Trash2, RefreshCw, Zap, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { api, ApiError } from "../lib/api.js";

/* ── Grade database — you add grades here as you confirm them per product ──
 * Keys must match what you type in the "LIMEX Grade" field on each product.
 * cao3: CaCO3 content %, density: g/cm³, mfr: g/10min, ghg: kg-CO2e/kg   */
const KNOWN_GRADES: Record<string, { cao3: number; density: number; mfr: number; ghg: number }> = {
  "PE78-02M": { cao3: 78, density: 1.90, mfr: 0.6, ghg: 0.542 },
};

/* ── Types ── */
interface Composition {
  name: string; pct: number; color: string; verified: boolean; source: string;
}
interface SpecRow {
  label: string; value: string; unit?: string; verified: boolean; source?: string; note?: string;
}
interface Highlight {
  num: string; label: string; unit?: string; verified: boolean; source?: string;
}
interface Co2Data {
  value: string; basis: string; verified: boolean; source?: string;
}
interface Product {
  id: string; index: string; name: string; category: string;
  status: "live" | "beta" | "soon";
  tagline: string; description: string;
  referenceGrade: string; mixRatio: string; moulding: string; application: string;
  composition: Composition[];
  specs: SpecRow[];
  highlights: Highlight[];
  co2: Co2Data;
}
type Products = Record<string, Product>;

/* ── Helpers ── */
function emptyProduct(id: string): Product {
  return {
    id, index: "0" + String(Date.now()).slice(-1), name: "", category: "",
    status: "soon", tagline: "", description: "",
    referenceGrade: "Not Specified", mixRatio: "", moulding: "Injection Moulding", application: "",
    composition: [
      { name: "LIMEX Compound", pct: 50, color: "#4f9a35", verified: false, source: "" },
      { name: "PP Homo-Polymer",  pct: 50, color: "#c4c7c0", verified: false, source: "" },
    ],
    specs: [
      { label: "Material Base", value: "", verified: false },
      { label: "LIMEX Grade",   value: "Not Specified", verified: false },
      { label: "Mixing Ratio",  value: "", verified: false },
      { label: "Process",       value: "Injection Moulding", verified: true },
      { label: "Application",   value: "", verified: false },
      { label: "Effective Limestone (CaCO3)", value: "", unit: "% by mass", verified: false },
    ],
    highlights: [
      { num: "", label: "LIMEX Ratio",     verified: false },
      { num: "", label: "Limestone in Part", verified: false },
      { num: "", label: "PE GHG",          unit: "kg-CO2e/kg", verified: false },
    ],
    co2: { value: "", basis: "", verified: false },
  };
}

function slugify(name: string): string {
  return name.trim()
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

/* ── Main page ── */
export function CaseStudiesPage() {
  const [products, setProducts] = useState<Products>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccessMsg(null), 3000);
  };

  const [seededFromLocal, setSeededFromLocal] = useState(false);

  const load = useCallback(async (fresh = false) => {
    setLoading(true); setError(null); setSeededFromLocal(false);
    try {
      const res = fresh
        ? await api.getFresh<{ products: Products | null }>("/api/case-studies")
        : await api.get<{ products: Products | null }>("/api/case-studies");

      const dbProducts: Products = res.data.products ?? {};

      // Bundled specs.json is the authoritative roster — it decides which
      // products exist — so the portal stays in sync with the shipped site on
      // every load. DB rows merge on top as field-level overrides, but only
      // for products still in specs.json: products added straight to
      // specs.json stay visible, and products removed from specs.json stay
      // gone even if a stale DB row survives.
      let p: Products = dbProducts;
      try {
        const fb = await fetch("/case-study/data/specs.json", { cache: "no-store" });
        if (fb.ok) {
          const json = await fb.json();
          const bundled = (json.products ?? {}) as Products;
          if (Object.keys(bundled).length > 0) {
            const overrides = Object.fromEntries(
              Object.entries(dbProducts).filter(([k]) => k in bundled),
            ) as Products;
            p = { ...bundled, ...overrides };
            if (Object.keys(overrides).length < Object.keys(bundled).length) {
              setSeededFromLocal(true);
            }
          }
        }
      } catch { /* DB products still stand if bundled fetch fails */ }

      setProducts(p);
      if (!selectedId && Object.keys(p).length) setSelectedId(Object.keys(p)[0]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load case studies");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { load(); }, []);

  const save = async (updated: Products) => {
    setSaving(true); setError(null);
    try {
      await api.patch("/api/case-studies", { products: updated });
      setProducts(updated);
      flash("Saved successfully");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const addProduct = () => {
    const id = slugify("New Product " + (Object.keys(products).length + 1));
    const p = emptyProduct(id);
    const updated = { ...products, [id]: p };
    setProducts(updated);
    setSelectedId(id);
  };

  const deleteProduct = (id: string) => {
    if (!window.confirm(`Delete product "${products[id]?.name || id}"?`)) return;
    const updated = { ...products };
    delete updated[id];
    setProducts(updated);
    setSelectedId(Object.keys(updated)[0] ?? null);
    save(updated);
  };

  const updateProduct = (id: string, p: Product) => {
    setProducts(prev => ({ ...prev, [id]: p }));
  };

  const selected = selectedId ? products[selectedId] : null;

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0, fontFamily: "var(--adm-font, Inter, sans-serif)" }}>
      {/* ── Sidebar ── */}
      <aside style={{ width: 240, borderRight: "1px solid var(--adm-border, #e5e7eb)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 14px 10px", borderBottom: "1px solid var(--adm-border, #e5e7eb)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Case Studies</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => load(true)} title="Refresh" style={iconBtn}>
              <RefreshCw size={13} />
            </button>
            <button onClick={addProduct} title="Add product" style={{ ...iconBtn, background: "var(--adm-accent, #1d4ed8)", color: "#fff" }}>
              <Plus size={13} />
            </button>
          </div>
        </div>
        {loading
          ? <div style={{ padding: 20, color: "var(--adm-muted, #6b7280)", fontSize: 12 }}>Loading…</div>
          : Object.keys(products).length === 0
          ? <div style={{ padding: 20, color: "var(--adm-muted, #6b7280)", fontSize: 12 }}>No products yet.<br />Click + to add one.</div>
          : Object.values(products).sort((a, b) => (parseInt(a.index, 10) || 0) - (parseInt(b.index, 10) || 0)).map(p => (
            <div key={p.id}
              onClick={() => setSelectedId(p.id)}
              style={{
                padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--adm-border, #f3f4f6)",
                background: selectedId === p.id ? "var(--adm-accent-light, #eff6ff)" : "transparent",
                borderLeft: selectedId === p.id ? "3px solid var(--adm-accent, #1d4ed8)" : "3px solid transparent",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ background: statusColor(p.status), color: "#fff", borderRadius: 3, padding: "1px 5px", fontSize: 10, fontWeight: 700 }}>
                  {p.index || "?"}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name || "(untitled)"}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--adm-muted, #6b7280)", marginTop: 2 }}>{p.category || "—"}</div>
            </div>
          ))
        }
      </aside>

      {/* ── Editor ── */}
      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {seededFromLocal && (
          <div style={{ background: "#fffbeb", color: "#92400e", padding: "10px 16px", fontSize: 13, borderBottom: "1px solid #fbbf24", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>⚠ Loaded from local specs.json — not yet in database. Click <strong>Save All</strong> to persist to the portal.</span>
          </div>
        )}
        {error && (
          <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px 16px", fontSize: 13, borderBottom: "1px solid #fca5a5" }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ background: "#f0fdf4", color: "#15803d", padding: "10px 16px", fontSize: 13, borderBottom: "1px solid #86efac" }}>
            {successMsg}
          </div>
        )}

        {!selected
          ? <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--adm-muted, #6b7280)", fontSize: 14 }}>
              Select a product from the sidebar or click <strong style={{ margin: "0 4px" }}>+</strong> to add one.
            </div>
          : <ProductEditor
              key={selectedId!}
              product={selected}
              onChange={p => updateProduct(selectedId!, p)}
              onSave={() => save(products)}
              onDelete={() => deleteProduct(selectedId!)}
              saving={saving}
            />
        }
      </main>
    </div>
  );
}

/* ── Product Editor ── */
function ProductEditor({
  product, onChange, onSave, onDelete, saving,
}: {
  product: Product;
  onChange: (p: Product) => void;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const set = <K extends keyof Product>(k: K, v: Product[K]) => onChange({ ...product, [k]: v });

  /* ── TDS Engine ── */
  const [tdsOpen, setTdsOpen] = useState(true);

  const applyTds = () => {
    const grade = KNOWN_GRADES[product.referenceGrade];
    const limexComp = product.composition.find(c => c.name.toLowerCase().includes("limex"));
    const limexPct = limexComp?.pct ?? 0;

    if (!grade) {
      alert(`Grade "${product.referenceGrade}" is not in the TDS database. Add it to KNOWN_GRADES in CaseStudiesPage.tsx to enable auto-calc.`);
      return;
    }

    const effectiveLimestone = +(limexPct * grade.cao3 / 100).toFixed(1);

    // Update spec rows in-place or append missing ones
    const specMap: Record<string, SpecRow> = {};
    product.specs.forEach(s => { specMap[s.label] = s; });

    const gradeLabel = product.referenceGrade;
    const updates: Record<string, Partial<SpecRow>> = {
      "LIMEX Grade":                  { value: gradeLabel, verified: true, source: "gsh-pe78-02m" },
      "Effective Limestone (CaCO3)":  { value: `~${effectiveLimestone}`, unit: "% by mass", verified: true, source: "gsh-pe78-02m", note: `${limexPct}% LIMEX × ${grade.cao3}% CaCO3` },
      [`${gradeLabel} CaCO3 Content`]: { value: String(grade.cao3), unit: "%", verified: true, source: "gsh-pe78-02m" },
      [`${gradeLabel} Density`]:      { value: String(grade.density), unit: "g/cm³", verified: true, source: "gsh-pe78-02m" },
      [`${gradeLabel} MFR`]:          { value: String(grade.mfr), unit: "g/10min", verified: true, source: "gsh-pe78-02m" },
      [`${gradeLabel} GHG`]:          { value: String(grade.ghg), unit: "kg-CO2e/kg", verified: true, source: "gsh-pe78-02m" },
    };

    const existingLabels = product.specs.map(s => s.label);
    const updatedSpecs = product.specs.map(s => {
      const upd = updates[s.label];
      return upd ? { ...s, ...upd } : s;
    });
    // Append any missing spec rows
    for (const [label, upd] of Object.entries(updates)) {
      if (!existingLabels.includes(label)) {
        updatedSpecs.push({ label, value: upd.value ?? "", unit: upd.unit, verified: upd.verified ?? false, source: upd.source, note: upd.note });
      }
    }

    // Update highlights[1] if it's the limestone highlight
    const updatedHighlights = product.highlights.map((h, i) => {
      if (i === 1 || h.label.toLowerCase().includes("limestone")) {
        return { ...h, num: `~${Math.round(effectiveLimestone)}%`, verified: true, source: "gsh-pe78-02m" };
      }
      if (i === 2 || h.label.toLowerCase().includes("ghg")) {
        return { ...h, num: String(grade.ghg), unit: "kg-CO2e/kg", verified: true, source: "gsh-pe78-02m" };
      }
      return h;
    });

    onChange({ ...product, specs: updatedSpecs, highlights: updatedHighlights });
  };

  return (
    <div style={{ padding: "20px 24px", flex: 1 }}>
      {/* ── Top bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{product.name || "(untitled)"}</div>
          <div style={{ fontSize: 12, color: "var(--adm-muted, #6b7280)" }}>id: {product.id}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onDelete} style={{ ...actionBtn, background: "#fff", color: "#b91c1c", border: "1px solid #fca5a5" }}>
            <Trash2 size={13} /> Delete
          </button>
          <button onClick={onSave} disabled={saving} style={{ ...actionBtn, background: "var(--adm-accent, #1d4ed8)", color: "#fff" }}>
            <Save size={13} /> {saving ? "Saving…" : "Save All"}
          </button>
        </div>
      </div>

      {/* ── Basic Info ── */}
      <Section title="Basic Info">
        <Row2>
          <Field label="Product Name" required>
            <input style={inp} value={product.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Motor Cover" />
          </Field>
          <Field label="Index">
            <input style={inp} value={product.index} onChange={e => set("index", e.target.value)} placeholder="01" />
          </Field>
        </Row2>
        <Row2>
          <Field label="Category">
            <input style={inp} value={product.category} onChange={e => set("category", e.target.value)} placeholder="e.g. Motor Fan Cover" />
          </Field>
          <Field label="Status">
            <select style={inp} value={product.status} onChange={e => set("status", e.target.value as Product["status"])}>
              <option value="live">Live</option>
              <option value="beta">Beta</option>
              <option value="soon">Soon</option>
            </select>
          </Field>
        </Row2>
        <Row2>
          <Field label="Mix Ratio">
            <input style={inp} value={product.mixRatio} onChange={e => set("mixRatio", e.target.value)} placeholder="50% LIMEX PE78-02M + 50% PP" />
          </Field>
          <Field label="Moulding Process">
            <input style={inp} value={product.moulding} onChange={e => set("moulding", e.target.value)} placeholder="Injection Moulding" />
          </Field>
        </Row2>
        <Field label="Application">
          <input style={inp} value={product.application} onChange={e => set("application", e.target.value)} placeholder="e.g. High-Speed Textile Spinning" />
        </Field>
        <Field label="Tagline (short)">
          <input style={inp} value={product.tagline} onChange={e => set("tagline", e.target.value)} placeholder="One-line tagline" />
        </Field>
        <Field label="Description">
          <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={product.description} onChange={e => set("description", e.target.value)} placeholder="Full product description shown in the case study detail panel" />
        </Field>
      </Section>

      {/* ── Composition ── */}
      <Section title="Composition">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--adm-bg-alt, #f9fafb)" }}>
                <Th>Material Name</Th><Th>%</Th><Th>Colour</Th><Th>Verified</Th><Th>Source</Th><Th />
              </tr>
            </thead>
            <tbody>
              {product.composition.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--adm-border, #e5e7eb)" }}>
                  <Td><input style={cellInp} value={c.name} onChange={e => {
                    const arr = [...product.composition]; arr[i] = { ...c, name: e.target.value }; set("composition", arr);
                  }} /></Td>
                  <Td><input style={{ ...cellInp, width: 60 }} type="number" min={0} max={100} value={c.pct} onChange={e => {
                    const arr = [...product.composition]; arr[i] = { ...c, pct: +e.target.value }; set("composition", arr);
                  }} /></Td>
                  <Td><div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="color" value={c.color} style={{ width: 32, height: 28, border: "none", cursor: "pointer", borderRadius: 4 }} onChange={e => {
                      const arr = [...product.composition]; arr[i] = { ...c, color: e.target.value }; set("composition", arr);
                    }} />
                    <span style={{ fontSize: 11, color: "var(--adm-muted, #6b7280)" }}>{c.color}</span>
                  </div></Td>
                  <Td><input type="checkbox" checked={c.verified} onChange={e => {
                    const arr = [...product.composition]; arr[i] = { ...c, verified: e.target.checked }; set("composition", arr);
                  }} /></Td>
                  <Td><input style={cellInp} value={c.source || ""} onChange={e => {
                    const arr = [...product.composition]; arr[i] = { ...c, source: e.target.value }; set("composition", arr);
                  }} placeholder="source key" /></Td>
                  <Td><button style={removeBtn} onClick={() => {
                    set("composition", product.composition.filter((_, j) => j !== i));
                  }}>✕</button></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button style={addRowBtn} onClick={() => set("composition", [...product.composition, { name: "", pct: 0, color: "#c4c7c0", verified: false, source: "" }])}>
          <Plus size={12} /> Add Component
        </button>
      </Section>

      {/* ── TDS Auto-Calc Engine ── */}
      <div style={{ marginBottom: 18, border: "1px solid #fbbf24", borderRadius: 8, overflow: "hidden" }}>
        <button
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fffbeb", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
          onClick={() => setTdsOpen(o => !o)}>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Zap size={14} style={{ color: "#d97706" }} /> Grade Auto-Calc Engine — enter your LIMEX grade data, auto-fills specs
          </span>
          {tdsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {tdsOpen && (
          <div style={{ padding: "14px 16px", borderTop: "1px solid #fbbf24", background: "#fffdf0" }}>
            <Row2>
              <Field label="LIMEX Grade">
                <div style={{ display: "flex", gap: 8 }}>
                  <input style={{ ...inp, flex: 1 }} value={product.referenceGrade} onChange={e => set("referenceGrade", e.target.value)} placeholder="PE78-02M or Not Specified" list="wd-grades" />
                  <datalist id="wd-grades">
                    <option value="Not Specified" />
                    {Object.keys(KNOWN_GRADES).map(g => <option key={g} value={g} />)}
                  </datalist>
                </div>
              </Field>
              <div style={{ paddingTop: 20 }}>
                <button onClick={applyTds} style={{ ...actionBtn, background: "#d97706", color: "#fff" }}>
                  <Zap size={13} /> Apply TDS Calculations
                </button>
              </div>
            </Row2>
            {KNOWN_GRADES[product.referenceGrade] && (() => {
              const g = KNOWN_GRADES[product.referenceGrade];
              const limexPct = product.composition.find(c => c.name.toLowerCase().includes("limex"))?.pct ?? 0;
              const eff = +(limexPct * g.cao3 / 100).toFixed(1);
              return (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "#fff", borderRadius: 6, border: "1px solid #fbbf24", fontSize: 12, color: "#78350f" }}>
                  <strong>{product.referenceGrade} TDS:</strong>{" "}
                  CaCO₃ {g.cao3}% · Density {g.density} g/cm³ · MFR {g.mfr} g/10min · GHG {g.ghg} kg-CO₂e/kg
                  <br />
                  <strong>At {limexPct}% LIMEX:</strong> Effective limestone ≈ <strong>{eff}%</strong> by mass
                </div>
              );
            })()}
            {product.referenceGrade === "Not Specified" && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#92400e", background: "#fef3c7", padding: "6px 10px", borderRadius: 6 }}>
                Set the LIMEX Grade to enable auto-calculation. Known grades: {Object.keys(KNOWN_GRADES).join(", ")}.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Highlights (3 stat boxes) ── */}
      <Section title="Highlights (3 Stat Boxes shown on detail page)">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--adm-bg-alt, #f9fafb)" }}>
                <Th>#</Th><Th>Number (e.g. 50% or ~31%)</Th><Th>Unit</Th><Th>Label</Th><Th>Verified</Th>
              </tr>
            </thead>
            <tbody>
              {product.highlights.map((h, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--adm-border, #e5e7eb)" }}>
                  <Td style={{ color: "var(--adm-muted, #6b7280)", width: 24 }}>{i + 1}</Td>
                  <Td><input style={cellInp} value={h.num} onChange={e => {
                    const arr = [...product.highlights]; arr[i] = { ...h, num: e.target.value }; set("highlights", arr);
                  }} placeholder="50%" /></Td>
                  <Td><input style={{ ...cellInp, width: 120 }} value={h.unit || ""} onChange={e => {
                    const arr = [...product.highlights]; arr[i] = { ...h, unit: e.target.value }; set("highlights", arr);
                  }} placeholder="kg-CO2e/kg" /></Td>
                  <Td><input style={cellInp} value={h.label} onChange={e => {
                    const arr = [...product.highlights]; arr[i] = { ...h, label: e.target.value }; set("highlights", arr);
                  }} placeholder="LIMEX PE78-02M" /></Td>
                  <Td><input type="checkbox" checked={h.verified} onChange={e => {
                    const arr = [...product.highlights]; arr[i] = { ...h, verified: e.target.checked }; set("highlights", arr);
                  }} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Spec Grid ── */}
      <Section title="Technical Specifications (full spec grid on detail page)">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--adm-bg-alt, #f9fafb)" }}>
                <Th style={{ width: 20 }}></Th>
                <Th>Label</Th><Th>Value</Th><Th>Unit</Th><Th>Verified</Th><Th>Note</Th><Th />
              </tr>
            </thead>
            <tbody>
              {product.specs.map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--adm-border, #e5e7eb)" }}>
                  <Td><GripVertical size={12} style={{ color: "var(--adm-muted, #9ca3af)", cursor: "grab" }} /></Td>
                  <Td><input style={cellInp} value={s.label} onChange={e => {
                    const arr = [...product.specs]; arr[i] = { ...s, label: e.target.value }; set("specs", arr);
                  }} /></Td>
                  <Td><input style={cellInp} value={s.value} onChange={e => {
                    const arr = [...product.specs]; arr[i] = { ...s, value: e.target.value }; set("specs", arr);
                  }} /></Td>
                  <Td><input style={{ ...cellInp, width: 110 }} value={s.unit || ""} onChange={e => {
                    const arr = [...product.specs]; arr[i] = { ...s, unit: e.target.value }; set("specs", arr);
                  }} placeholder="g/cm³" /></Td>
                  <Td><input type="checkbox" checked={s.verified} onChange={e => {
                    const arr = [...product.specs]; arr[i] = { ...s, verified: e.target.checked }; set("specs", arr);
                  }} /></Td>
                  <Td><input style={{ ...cellInp, width: 160 }} value={s.note || ""} onChange={e => {
                    const arr = [...product.specs]; arr[i] = { ...s, note: e.target.value }; set("specs", arr);
                  }} placeholder="optional note" /></Td>
                  <Td><button style={removeBtn} onClick={() => set("specs", product.specs.filter((_, j) => j !== i))}>✕</button></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button style={addRowBtn} onClick={() => set("specs", [...product.specs, { label: "", value: "", verified: false }])}>
          <Plus size={12} /> Add Spec Row
        </button>
      </Section>

      {/* ── CO2 Data ── */}
      <Section title="CO₂ / GHG Data">
        <Row2>
          <Field label="CO₂ Reduction Value">
            <input style={inp} value={product.co2?.value ?? ""} onChange={e => set("co2", { ...product.co2, value: e.target.value })} placeholder="~24–38%" />
          </Field>
          <Field label="Verified">
            <div style={{ paddingTop: 6 }}>
              <input type="checkbox" checked={product.co2?.verified ?? false} onChange={e => set("co2", { ...product.co2, verified: e.target.checked })} />
              <span style={{ marginLeft: 6, fontSize: 12 }}>Data source confirmed</span>
            </div>
          </Field>
        </Row2>
        <Field label="Basis / Disclaimer">
          <textarea style={{ ...inp, minHeight: 64, resize: "vertical" }} value={product.co2?.basis ?? ""} onChange={e => set("co2", { ...product.co2, basis: e.target.value })} placeholder="GHG reduction context and caveats…" />
        </Field>
      </Section>

      {/* Save bottom bar */}
      <div style={{ padding: "12px 0 32px", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onSave} disabled={saving} style={{ ...actionBtn, background: "var(--adm-accent, #1d4ed8)", color: "#fff", padding: "10px 28px", fontSize: 14 }}>
          <Save size={14} /> {saving ? "Saving…" : "Save All Products"}
        </button>
      </div>
    </div>
  );
}

/* ── Tiny sub-components ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--adm-muted, #6b7280)", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid var(--adm-border, #e5e7eb)" }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}
function Row2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4, color: "var(--adm-muted, #6b7280)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}
function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, fontWeight: 700, color: "var(--adm-muted, #6b7280)", textTransform: "uppercase", letterSpacing: "0.06em", ...style }}>{children}</th>;
}
function Td({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "6px 8px", verticalAlign: "middle", ...style }}>{children}</td>;
}

/* ── Styles ── */
const inp: React.CSSProperties = {
  width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--adm-border, #d1d5db)",
  borderRadius: 6, background: "#fff", boxSizing: "border-box", outline: "none",
};
const cellInp: React.CSSProperties = {
  width: "100%", padding: "4px 6px", fontSize: 12, border: "1px solid var(--adm-border, #e5e7eb)",
  borderRadius: 4, background: "#fff", boxSizing: "border-box",
};
const iconBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 26, height: 26, border: "1px solid var(--adm-border, #d1d5db)",
  borderRadius: 6, cursor: "pointer", background: "#fff", color: "inherit",
};
const actionBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 5,
  padding: "7px 14px", borderRadius: 6, border: "none",
  cursor: "pointer", fontSize: 13, fontWeight: 600,
};
const addRowBtn: React.CSSProperties = {
  marginTop: 8, display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600,
  color: "var(--adm-accent, #1d4ed8)", background: "none", border: "1px dashed var(--adm-accent, #93c5fd)",
  borderRadius: 6, padding: "5px 12px", cursor: "pointer",
};
const removeBtn: React.CSSProperties = {
  background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "2px 4px",
};

function statusColor(s: string) {
  if (s === "live") return "#16a34a";
  if (s === "beta") return "#d97706";
  return "#6b7280";
}
