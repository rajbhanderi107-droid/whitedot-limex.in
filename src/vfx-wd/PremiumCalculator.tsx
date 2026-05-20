import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import LottieMicroIcon from "./LottieMicroIcon";

const grades = {
  molding: {
    label: "Molding route",
    shortLabel: "Molding",
    load: 54,
    ppOffset: 38,
    marginRoom: 0.16,
    fit: "Dimension-led trials",
    recommendation: "Start with molded sample trials and dimensional stability checks.",
  },
  sheet: {
    label: "Sheet route",
    shortLabel: "Sheet",
    load: 62,
    ppOffset: 46,
    marginRoom: 0.2,
    fit: "Best sales fit",
    recommendation: "Best fit for sheet, print, signage, folder, and rigid packaging conversations.",
  },
  nonwoven: {
    label: "Nonwoven route",
    shortLabel: "Nonwoven",
    load: 70,
    ppOffset: 53,
    marginRoom: 0.18,
    fit: "PP-heavy formats",
    recommendation: "Strong route for PP-heavy formats where mineral loading and fabric behavior can be tested.",
  },
} as const;

type GradeId = keyof typeof grades;

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }

    const start = displayValue;
    const delta = value - start;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 650, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(start + delta * eased);
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </>
  );
}

export default function PremiumCalculator() {
  const [monthlyTons, setMonthlyTons] = useState(18);
  const [ppPrice, setPpPrice] = useState(112);
  const [gradeId, setGradeId] = useState<GradeId>("sheet");

  const grade = grades[gradeId];
  const metrics = useMemo(() => {
    const monthlyKg = monthlyTons * 1000;
    const mineralKg = monthlyKg * (grade.load / 100);
    const ppOffsetKg = monthlyKg * (grade.ppOffset / 100);
    const costRoom = ppOffsetKg * ppPrice * grade.marginRoom;
    const annualCostRoom = costRoom * 12;

    return {
      monthlyKg,
      mineralKg,
      ppOffsetKg,
      costRoom,
      annualCostRoom,
      conversionFit: Math.min(96, 56 + grade.load * 0.52),
      grade,
    };
  }, [grade, monthlyTons, ppPrice]);
  const graphBars = [
    { label: "PP base", value: 46 },
    { label: "PP offset", value: grade.ppOffset },
    { label: "Mineral", value: grade.load },
    { label: "Fit", value: Math.round(metrics.conversionFit) },
  ];

  return (
    <section className="section vfx-wd-calculator" id="limex-calculator">
      <div className="section-kicker">
        <LottieMicroIcon variant="meter" />
        Material economics dashboard
      </div>
      <div className="split-heading">
        <h2>A calculator-style board for buyer qualification.</h2>
        <p>
          Use the dashboard as a sales discussion aid, not a public guarantee. Final numbers should
          come from buyer trials, resin grades, machine settings, and signed commercial quotations.
        </p>
      </div>

      <div className="vfx-wd-dashboard">
        <div className="vfx-wd-dashboard-controls">
          <label>
            <span>Monthly volume</span>
            <strong>{monthlyTons} tons</strong>
            <input
              type="range"
              min="2"
              max="80"
              value={monthlyTons}
              onChange={(event) => setMonthlyTons(Number(event.currentTarget.value))}
            />
          </label>
          <label>
            <span>Current PP reference</span>
            <strong>INR {ppPrice}/kg</strong>
            <input
              type="range"
              min="70"
              max="180"
              value={ppPrice}
              onChange={(event) => setPpPrice(Number(event.currentTarget.value))}
            />
          </label>

          <div className="vfx-wd-grade-switch" aria-label="PP grade comparison">
            {(Object.keys(grades) as GradeId[]).map((key) => (
              <button
                className={key === gradeId ? "active" : ""}
                type="button"
                key={key}
                onClick={() => setGradeId(key)}
              >
                {grades[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="vfx-wd-dashboard-summary" data-vfx-tilt>
          <span>Active recommendation</span>
          <strong>{grade.fit}</strong>
          <p>
            {grade.shortLabel} path modeled at {grade.load}% mineral loading for {formatNumber(metrics.monthlyKg)} kg/month.
          </p>
        </div>

        <div className="vfx-wd-metric-grid">
          <article className="vfx-wd-metric-card" data-vfx-tilt>
            <span>Mineral loading model</span>
            <strong>
              <AnimatedNumber value={grade.load} suffix="%" />
            </strong>
            <div className="vfx-wd-meter" style={{ "--meter": grade.load / 100 } as CSSProperties}>
              <i />
            </div>
          </article>

          <article className="vfx-wd-metric-card" data-vfx-tilt>
            <span>Estimated PP offset</span>
            <strong>
              <AnimatedNumber value={metrics.ppOffsetKg} suffix=" kg/mo" />
            </strong>
            <div className="vfx-wd-meter" style={{ "--meter": grade.ppOffset / 100 } as CSSProperties}>
              <i />
            </div>
          </article>

          <article className="vfx-wd-metric-card" data-vfx-tilt>
            <span>Projected cost room</span>
            <strong>
              <AnimatedNumber value={metrics.costRoom} prefix="INR " suffix="/mo" />
            </strong>
            <div className="vfx-wd-meter" style={{ "--meter": metrics.conversionFit / 100 } as CSSProperties}>
              <i />
            </div>
          </article>
        </div>

        <div className="vfx-wd-graph-card" data-vfx-tilt>
          <div>
            <span>PP grade comparison</span>
            <strong>{grade.label}</strong>
            <p>Indicative planning mix for the selected commercial route.</p>
          </div>
          <div className="vfx-wd-bars" aria-label="PP grade comparison graph">
            {graphBars.map((bar) => (
              <span key={bar.label} style={{ "--bar": bar.value / 100 } as CSSProperties}>
                <i />
                <small>{bar.label}</small>
                <b>{bar.value}%</b>
              </span>
            ))}
          </div>
        </div>

        <div className="vfx-wd-result-card" data-vfx-tilt>
          <LottieMicroIcon variant="check" />
          <span>LIMEX recommendation</span>
          <h3>{grade.recommendation}</h3>
          <p>
            Model output: {formatNumber(metrics.mineralKg)} kg/month mineral-led material planning,
            with an annual buying-room estimate of INR {formatNumber(metrics.annualCostRoom)}.
          </p>
        </div>
      </div>
    </section>
  );
}
