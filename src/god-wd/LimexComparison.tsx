import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ClipboardCheck,
  Factory,
  Feather,
  FlaskConical,
  Gauge,
  Globe2,
  IndianRupee,
  Layers,
  Microscope,
  PackageCheck,
  Recycle,
  Settings,
  ShieldCheck,
  Sparkles,
  Split,
  Syringe,
  Target,
  TrendingUp,
  Wind,
  type LucideIcon,
} from "lucide-react";
import {
  comparisonCategories,
  comparisonRows,
  keyDifferences,
  verdict,
  type ComparisonCategory,
} from "./god-wd-data";

const ENABLED = import.meta.env.VITE_WD_GOD_ENABLED !== "false";

const iconMap: Record<string, LucideIcon> = {
  Globe2,
  Target,
  FlaskConical,
  Microscope,
  Layers,
  Feather,
  Sparkles,
  TrendingUp,
  Gauge,
  Settings,
  ClipboardCheck,
  Wind,
  Syringe,
  ShieldCheck,
  Factory,
  PackageCheck,
  Recycle,
  BadgeCheck,
  IndianRupee,
};

type Filter = "All" | ComparisonCategory;
const filters: Filter[] = ["All", ...comparisonCategories];

export function LimexComparison() {
  if (!ENABLED) return null;
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Filter>("All");

  const rows =
    active === "All"
      ? comparisonRows
      : comparisonRows.filter((row) => row.category === active);

  const rowVariants: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
    exit: reduce ? { opacity: 0 } : { opacity: 0, y: -8 },
  };

  return (
    <section className="section god-wd-compare" id="limex-vs-fillers" aria-label="LIMEX compared with local CaCO3 fillers">
      <div className="section-kicker">
        <Split size={18} />
        <span className="wd-limex">LIMEX</span> material vs local fillers
      </div>
      <div className="split-heading">
        <h2>Why <span className="wd-limex">LIMEX</span> is an engineered material, not a cheap filler.</h2>
        <p>
          Local CaCO₃ fillers add weight. <span className="wd-limex">LIMEX</span> is engineered to replace plastic while keeping
          the way the polymer processes and performs. The differences below are drawn from
          White Dot&rsquo;s technical comparison and should be confirmed per grade and trial.
        </p>
      </div>

      {/* Key-difference metric strip */}
      <div className="god-wd-metric-strip" aria-label="Headline differences at a glance">
        {keyDifferences.map((item, index) => (
          <motion.article
            className="god-wd-metric"
            key={item.metric}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.45, delay: reduce ? 0 : index * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="god-wd-metric-label">{item.metric}</span>
            <div className="god-wd-metric-values">
              <strong className="god-wd-metric-limex">{item.limex}</strong>
              <span className="god-wd-metric-vs">vs</span>
              <span className="god-wd-metric-local">{item.local}</span>
            </div>
            <p>{item.note}</p>
          </motion.article>
        ))}
      </div>

      {/* Interactive category filter */}
      <div className="god-wd-filter" role="tablist" aria-label="Filter comparison by category">
        {filters.map((filter) => {
          const isActive = filter === active;
          return (
            <button
              key={filter}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`god-wd-filter-tab${isActive ? " is-active" : ""}`}
              onClick={() => setActive(filter)}
            >
              {isActive && (
                <motion.span
                  layoutId="god-wd-filter-pill"
                  className="god-wd-filter-pill"
                  aria-hidden="true"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span>{filter}</span>
            </button>
          );
        })}
      </div>

      {/* Column header */}
      <div className="god-wd-compare-head" aria-hidden="true">
        <span className="god-wd-col-aspect">Aspect</span>
        <span className="god-wd-col-limex">
          <ShieldCheck size={15} /> <span className="wd-limex">LIMEX</span> (<span className="wd-tbm">TBM</span>)
        </span>
        <span className="god-wd-col-local">Local filler</span>
      </div>

      {/* Comparison rows */}
      <motion.div className="god-wd-compare-list" layout={!reduce}>
        <AnimatePresence mode="popLayout" initial={false}>
          {rows.map((row) => {
            const Icon = iconMap[row.icon] ?? Sparkles;
            return (
              <motion.article
                className="god-wd-row"
                key={row.label}
                layout={!reduce}
                variants={rowVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="god-wd-row-aspect">
                  <Icon size={18} aria-hidden="true" />
                  <span>{row.label}</span>
                </div>
                <div className="god-wd-row-limex">
                  <span className="god-wd-tag god-wd-tag-limex" aria-hidden="true">
                    <span className="wd-limex">LIMEX</span>
                  </span>
                  <p>{row.limex}</p>
                </div>
                <div className="god-wd-row-local">
                  <span className="god-wd-tag god-wd-tag-local" aria-hidden="true">
                    Local
                  </span>
                  <p>{row.local}</p>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Verdict / savings callout */}
      <motion.div
        className="god-wd-verdict"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="god-wd-verdict-body">
          <span className="god-wd-verdict-kicker">The bottom line</span>
          <h3>{verdict.title}</h3>
          <ul>
            {verdict.points.map((point) => (
              <li key={point}>
                <Check size={17} aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="god-wd-verdict-note">{verdict.note}</p>
        </div>
        <a className="god-wd-verdict-cta" href="#contact">
          Plan a <span className="wd-limex">LIMEX</span> trial
          <ArrowRight size={18} aria-hidden="true" />
        </a>
      </motion.div>

      <p className="god-wd-compare-note">
        Comparison values are technical talking points for sampling and trial planning. Final
        suitability depends on the buyer&rsquo;s product, resin system, machine, and grade.
      </p>
    </section>
  );
}
