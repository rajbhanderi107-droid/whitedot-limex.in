/* ─────────────────────────────────────────────────────────────
   White Dot · Case Study TDS Engine
   - Reads verified data from ../data/specs.json (single source of truth)
   - Hydrates the spec panel (progressive enhancement)
   - Generates a downloadable PDF Technical Data Sheet (jsPDF, client-side)
   Deterministic: the PDF data path uses ONLY verified JSON — no AI, no
   hallucination. AI is used only OFFLINE (agent/spec-agent.mjs) to draft
   new product specs for human review before they enter specs.json.
   ───────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  const PRODUCT = document.body.dataset.product || "bobbin";
  const DATA_URL = new URL("./data/specs.json", document.baseURI).href;
  const JSPDF_URL = new URL("./js/jspdf.umd.min.js", document.baseURI).href;

  const ORANGE = [79, 154, 53];   // site accent green
  const INK = [17, 17, 17];
  const MUTE = [68, 68, 68];
  const FAINT = [111, 111, 111];
  const LINE = [221, 219, 211];

  let DB = null;

  fetch(DATA_URL, { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error("specs.json " + r.status); return r.json(); })
    .then((db) => {
      DB = db;
      const p = db.products[PRODUCT];
      if (!p) { console.warn("[TDS] no product:", PRODUCT); return; }
      markVerified(p);
      wireDownload(p, db);
    })
    .catch((e) => console.warn("[TDS] data load failed:", e.message));

  /* Add a small "verified" badge next to data that is cited. Non-destructive. */
  function markVerified(p) {
    const host = document.querySelector("[data-tds-verified-slot]");
    if (host) {
      const specs = p.specs || [];
      if (!specs.length) return;
      const verifiedCount = specs.filter((s) => s.verified).length;
      host.innerHTML =
        '<span class="tds-verified-dot"></span>' +
        verifiedCount + " of " + specs.length +
        " fields verified from photo references or published supplier data";
    }
  }

  function wireDownload(p, db) {
    const btns = document.querySelectorAll("[data-download-tds]");
    if (!btns.length) return;
    btns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const original = btn.innerHTML;
        btn.innerHTML = "<span>Preparing TDS…</span>";
        btn.style.pointerEvents = "none";
        ensureJsPDF()
          .then(() => { buildPDF(p, db); })
          .catch((err) => { console.error(err); alert("Could not generate the TDS. Please check your connection and retry."); })
          .finally(() => { btn.innerHTML = original; btn.style.pointerEvents = ""; });
      });
    });
  }

  function ensureJsPDF() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = JSPDF_URL;
      s.onload = () => res();
      s.onerror = () => rej(new Error("jsPDF failed to load"));
      document.head.appendChild(s);
    });
  }

  /* ── Deterministic PDF Technical Data Sheet ── */
  function buildPDF(p, db) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const M = 48;
    let y = 0;

    // Header band
    doc.setFillColor(...INK);
    doc.rect(0, 0, W, 96, "F");
    doc.setFillColor(...ORANGE);
    doc.rect(0, 96, W, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("TECHNICAL DATA SHEET", M, 44);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 196);
    doc.text("White Dot  -  Authorized Marketing & Sales - TBM LIMEX", M, 62);
    doc.setTextColor(...ORANGE.map((c) => Math.min(255, c + 40)));
    doc.setFontSize(8);
    doc.text("CASE STUDY " + (p.index || "") + "  -  " + (p.mixRatio || p.referenceGrade || ""), M, 78);

    y = 132;

    // Product title
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text(p.name, M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTE);
    y += 18;
    const tag = (p.category || "") + "  -  " + (p.moulding || "") + "  -  " + (p.application || "");
    doc.text(tag, M, y);

    // Description
    y += 22;
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTE);
    const desc = doc.splitTextToSize(p.description || p.tagline || "", W - M * 2);
    doc.text(desc, M, y);
    y += desc.length * 12.5 + 14;

    // Composition section
    y = sectionTitle(doc, "MATERIAL COMPOSITION", M, y, W);
    (p.composition || []).forEach((c) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...INK);
      doc.text(c.pct + "%", M, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTE);
      doc.text(c.name, M + 46, y);
      // bar
      const bw = 150, bx = W - M - bw;
      doc.setFillColor(...LINE);
      doc.rect(bx, y - 7, bw, 6, "F");
      const col = hexToRgb(c.color) || ORANGE;
      doc.setFillColor(...col);
      doc.rect(bx, y - 7, bw * (c.pct / 100), 6, "F");
      y += 18;
    });
    y += 6;

    // Key formulation summary.
    doc.setFillColor(245, 248, 244);
    doc.roundedRect(M, y, W - M * 2, 58, 8, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...INK);
    doc.text(p.mixRatio || "Per lot TDS", M + 16, y + 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTE);
    doc.text("Declared formulation for this case study. Grade-level values remain subject to final supplier lot TDS.", M + 16, y + 42);
    y += 78;

    // Specs table
    y = sectionTitle(doc, "SPECIFICATIONS", M, y, W);
    doc.setFontSize(9.5);
    (p.specs || []).forEach((s) => {
      if (y > 740) { doc.addPage(); y = 60; }
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...FAINT);
      doc.text(s.label.toUpperCase(), M, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...INK);
      const val = s.value + (s.unit ? " " + s.unit : "");
      doc.text(val, W - M, y, { align: "right" });
      // verified tick
      if (s.verified) {
        doc.setFillColor(...ORANGE);
        doc.circle(M - 10, y - 3, 1.6, "F");
      }
      doc.setDrawColor(...LINE);
      doc.line(M, y + 6, W - M, y + 6);
      y += 20;
    });

    // CO2 callout — skipped when the figure is unknown, otherwise a
    // spec-pending product prints an empty highlight box.
    if (p.co2 && p.co2.value) {
      y += 8;
      if (y > 700) { doc.addPage(); y = 60; }
      doc.setFillColor(248, 243, 234);
      doc.roundedRect(M, y - 4, W - M * 2, 56, 6, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(...ORANGE);
      doc.text(p.co2.value, M + 14, y + 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTE);
      const basis = doc.splitTextToSize(p.co2.basis, W - M * 2 - 120);
      doc.text(basis, M + 110, y + 12);
      y += 70;
    }

    // Sources + disclaimer
    if (y > 660) { doc.addPage(); y = 60; }
    y = sectionTitle(doc, "SOURCES & VERIFICATION", M, y, W);
    doc.setFontSize(7.5);
    doc.setTextColor(...FAINT);
    const usedKeys = new Set();
    (p.specs || []).concat(p.composition || [], p.highlights || [], [p.co2 || {}]).forEach((x) => x && x.source && usedKeys.add(x.source));
    const srcLines = [];
    usedKeys.forEach((k) => { if (db.sources[k]) srcLines.push("• " + db.sources[k]); });
    srcLines.push("• Prepared " + (db._meta.lastResearched || "") + ". Photo-reference fields are derived from supplied product images. User-supplied formulation fields are marked unverified until confirmed against final supplier lot TDS.");
    const wrapped = doc.splitTextToSize(srcLines.join("\n"), W - M * 2);
    doc.text(wrapped, M, y);
    y += wrapped.length * 10 + 16;

    // Footer
    const H = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...LINE);
    doc.line(M, H - 50, W - M, H - 50);
    doc.setFontSize(7.5);
    doc.setTextColor(...FAINT);
    doc.text("(c) 2026 White Dot - LIMEX is a registered trademark of TBM Co., Ltd., Japan", M, H - 34);
    doc.text("Generated " + new Date().toISOString().slice(0, 10) + " - whitedotindia.in", M, H - 22);

    doc.save("White-Dot-TDS-" + safeFileName(p.name) + "-" + safeFileName(p.mixRatio || p.referenceGrade || "LIMEX") + ".pdf");
    track("tds_download", { product: p.id });
  }

  function sectionTitle(doc, text, M, y, W) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(79, 154, 53);
    doc.text(text, M, y);
    doc.setDrawColor(221, 219, 211);
    doc.line(M, y + 7, W - 48, y + 7);
    return y + 24;
  }

  function hexToRgb(h) {
    if (!h) return null;
    const m = h.replace("#", "");
    return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
  }

  function safeFileName(s) {
    return String(s || "")
      .replace(/%/g, "pct")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function track(ev, d) { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: ev }, d || {})); }
})();
