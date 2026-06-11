/* Reusable portal UI primitives. Styled by portal.css, built on the
 * existing .adm-* design tokens so the portal matches the public brand
 * (TBM near-black canvas, tree-leaf green accent). */

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from "lucide-react";
import type { ModuleStatus } from "./modules.js";

/* ─── KPI card ─────────────────────────────────────────────── */

interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  /** signed delta in %; positive = green up, negative = red down */
  delta?: number;
  /** muted footnote, e.g. "vs last month" or "instrumentation pending" */
  foot?: string;
  to?: string;
  /** dim the card + show the foot as the reason it's not live yet */
  pending?: boolean;
}

export function KpiCard({ label, value, icon: Icon, delta, foot, to, pending }: KpiCardProps) {
  const body = (
    <div className={`wd-kpi${pending ? " wd-kpi-pending" : ""}`}>
      <div className="wd-kpi-top">
        <span className="wd-kpi-label">{label}</span>
        {Icon && <Icon size={15} className="wd-kpi-icon" />}
      </div>
      <div className="wd-kpi-value">{value}</div>
      <div className="wd-kpi-foot">
        {typeof delta === "number" && !pending && (
          <span className={`wd-delta ${delta > 0 ? "up" : delta < 0 ? "down" : "flat"}`}>
            {delta > 0 ? <ArrowUpRight size={12} /> : delta < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
            {Math.abs(delta)}%
          </span>
        )}
        {foot && <span className="wd-kpi-note">{foot}</span>}
      </div>
    </div>
  );
  return to ? <Link to={to} className="wd-kpi-link">{body}</Link> : body;
}

/* ─── Section header ───────────────────────────────────────── */

export function SectionHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="wd-section-head">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {right && <div className="wd-section-head-right">{right}</div>}
    </div>
  );
}

/* ─── Status / risk badges ─────────────────────────────────── */

export function StatusBadge({ status }: { status: ModuleStatus }) {
  const map: Record<ModuleStatus, string> = { live: "Live", beta: "Beta", soon: "Scaffolded" };
  return <span className={`wd-status wd-status-${status}`}>{map[status]}</span>;
}

export type Risk = "low" | "medium" | "high" | "critical";

export function RiskBadge({ risk }: { risk: Risk }) {
  return <span className={`wd-risk wd-risk-${risk}`}>{risk}</span>;
}

/* ─── Health ring (0–100) ──────────────────────────────────── */

export function HealthRing({ label, value }: { label: string; value: number }) {
  const tone = value >= 80 ? "good" : value >= 55 ? "warn" : "bad";
  const r = 16;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className={`wd-ring wd-ring-${tone}`} title={`${label}: ${value}/100`}>
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} className="wd-ring-track" />
        <circle cx="20" cy="20" r={r} className="wd-ring-arc"
          strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 20 20)" />
      </svg>
      <span className="wd-ring-val">{value}</span>
      <span className="wd-ring-label">{label}</span>
    </div>
  );
}

/* ─── Sparkline (dependency-free inline SVG) ───────────────── */

export function Sparkline({ data, width = 240, height = 56 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return <div className="wd-spark-empty">No trend data yet</div>;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / span) * height).toFixed(1)}`);
  return (
    <svg className="wd-spark" width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline className="wd-spark-fill" points={`0,${height} ${pts.join(" ")} ${width},${height}`} />
      <polyline className="wd-spark-line" points={pts.join(" ")} />
    </svg>
  );
}

/* ─── Card shell ───────────────────────────────────────────── */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`wd-card ${className}`}>{children}</div>;
}
