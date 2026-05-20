import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const categories = [
  "Injection molded",
  "Blow molded",
  "Sheet / thermoform",
  "Packaging film",
  "Nonwoven / fabric",
  "Retail / bags",
] as const;
const polymers = ["PP", "PE", "PET", "PS", "Other"] as const;

const categoryFit: Record<string, number> = {
  "Injection molded": 0.96,
  "Blow molded": 0.86,
  "Sheet / thermoform": 0.92,
  "Packaging film": 0.76,
  "Nonwoven / fabric": 0.82,
  "Retail / bags": 0.88,
};
const polymerFit: Record<string, number> = { PP: 0.96, PE: 0.9, PET: 0.7, PS: 0.82, Other: 0.62 };

/** Animated number tween (respects reduced motion). */
function useCountUp(target: number, duration = 650) {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      setVal(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduce]);
  return val;
}

export function AiEngine() {
  const [category, setCategory] = useState<string>(categories[0]);
  const [polymer, setPolymer] = useState<string>(polymers[0]);
  const [scale, setScale] = useState(20); // tonnes / month
  const [flexibility, setFlexibility] = useState(40); // 0..100 (higher = needs more flex)
  const [sustainability, setSustainability] = useState(70); // 0..100 ambition

  const result = useMemo(() => {
    const cf = categoryFit[category] ?? 0.8;
    const pf = polymerFit[polymer] ?? 0.7;
    const base = cf * pf; // 0..1
    // higher flexibility need slightly lowers max loading; higher sustainability ambition raises it
    const flexPenalty = (flexibility / 100) * 0.18;
    const sustainPush = (sustainability / 100) * 0.12;
    const loading = Math.max(20, Math.min(80, Math.round((base - flexPenalty + sustainPush) * 90)));
    const compatibility = Math.round(base * 100);
    const plasticReduction = loading; // loading replaces that share of plastic
    // crude savings band: more scale + more loading → larger absolute material savings
    const savingsLow = Math.round(scale * loading * 0.9);
    const savingsHigh = Math.round(scale * loading * 1.6);
    const verdict =
      compatibility >= 80 ? "Excellent fit" : compatibility >= 65 ? "Good fit — pilot advised" : "Trial required";
    return { compatibility, loading, plasticReduction, savingsLow, savingsHigh, verdict };
  }, [category, polymer, scale, flexibility, sustainability]);

  const compat = useCountUp(result.compatibility);
  const reduction = useCountUp(result.plasticReduction);
  const loadingV = useCountUp(result.loading);

  return (
    <section className="cine-section cine-ai" id="engine">
      <span className="cine-kicker">AI Material Optimization Engine</span>
      <h2>Model your plastic reduction in seconds.</h2>
      <p className="lead">
        Enter your production profile. The engine estimates LIMEX compatibility, achievable plastic
        reduction, and material-savings range. Indicative only — confirmed by sampling and trial.
      </p>

      <div className="cine-ai-grid">
        {/* Inputs */}
        <div className="cine-ai-inputs">
          <label className="cine-ai-field">
            <span>Product category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="cine-ai-field">
            <span>Current polymer</span>
            <select value={polymer} onChange={(e) => setPolymer(e.target.value)}>
              {polymers.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="cine-ai-field">
            <span>Production scale — {scale} T/month</span>
            <input type="range" min={1} max={200} value={scale} onChange={(e) => setScale(+e.target.value)} />
          </label>
          <label className="cine-ai-field">
            <span>Flexibility requirement — {flexibility}%</span>
            <input type="range" min={0} max={100} value={flexibility} onChange={(e) => setFlexibility(+e.target.value)} />
          </label>
          <label className="cine-ai-field">
            <span>Sustainability ambition — {sustainability}%</span>
            <input type="range" min={0} max={100} value={sustainability} onChange={(e) => setSustainability(+e.target.value)} />
          </label>
        </div>

        {/* Outputs */}
        <div className="cine-ai-out">
          <div className="cine-ai-score">
            <div className="cine-ai-gauge" style={{ ["--p" as string]: `${compat}` }}>
              <span className="cine-ai-gauge-val">{Math.round(compat)}</span>
              <span className="cine-ai-gauge-unit">/100</span>
            </div>
            <div className="cine-ai-score-meta">
              <strong>LIMEX compatibility</strong>
              <span className="cine-ai-verdict">{result.verdict}</span>
            </div>
          </div>

          <div className="cine-ai-metric">
            <div className="cine-ai-metric-head">
              <span>Estimated plastic reduction</span>
              <strong>{Math.round(reduction)}%</strong>
            </div>
            <div className="cine-ai-bar">
              <motion.i style={{ width: `${reduction}%` }} />
            </div>
          </div>

          <div className="cine-ai-metric">
            <div className="cine-ai-metric-head">
              <span>Recommended LIMEX loading</span>
              <strong>{Math.round(loadingV)}%</strong>
            </div>
            <div className="cine-ai-bar">
              <motion.i className="alt" style={{ width: `${loadingV}%` }} />
            </div>
          </div>

          <div className="cine-ai-savings">
            <span>Indicative material savings</span>
            <strong>
              {result.savingsLow.toLocaleString()}–{result.savingsHigh.toLocaleString()} kg / month
            </strong>
          </div>

          <p className="cine-ai-note">
            Estimate only. Final loading and savings depend on grade, machine, and trial validation.
          </p>
        </div>
      </div>
    </section>
  );
}
