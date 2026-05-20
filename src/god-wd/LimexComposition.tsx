import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Boxes, Layers, Mountain, PackageCheck, type LucideIcon } from "lucide-react";
import { composition } from "./god-wd-data";

const ENABLED = import.meta.env.VITE_WD_GOD_ENABLED !== "false";

const stepIcons: Record<string, LucideIcon> = { Mountain, Boxes, PackageCheck };

export function LimexComposition() {
  if (!ENABLED) return null;
  const reduce = useReducedMotion();

  return (
    <section className="section god-wd-composition" id="inside-limex" aria-label="Inside LIMEX material">
      <div className="section-kicker">
        <Layers size={18} />
        Inside the material
      </div>
      <div className="split-heading">
        <h2>LIMEX is engineered around limestone, not padded with it.</h2>
        <p>
          A LIMEX pellet is more than half inorganic limestone (CaCO₃), compounded with a polymer
          binder so it runs on existing plastic machinery. That is the difference between an
          engineered material and a weight-adding filler.
        </p>
      </div>

      {/* Composition bar */}
      <div className="god-wd-comp-bar-wrap" aria-label="LIMEX pellet composition: over 50 percent limestone CaCO3, balance polymer binder">
        <div className="god-wd-comp-bar" aria-hidden="true">
          <motion.span
            className="god-wd-comp-caco3"
            initial={reduce ? { opacity: 0 } : { width: 0 }}
            whileInView={reduce ? { opacity: 1 } : { width: `${composition.caco3}%` }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="god-wd-comp-tag">CaCO₃ (limestone) 50%+</span>
          </motion.span>
          <span className="god-wd-comp-resin">
            <span className="god-wd-comp-tag">Polymer binder</span>
          </span>
        </div>
      </div>

      {/* Process flow */}
      <div className="god-wd-flow" aria-label="From limestone to finished product">
        {composition.steps.map((step, index) => {
          const Icon = stepIcons[step.icon] ?? Mountain;
          return (
            <motion.div
              className="god-wd-flow-step"
              key={step.title}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.45, delay: reduce ? 0 : index * 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="god-wd-flow-num" aria-hidden="true">{index + 1}</span>
              <Icon className="god-wd-flow-icon" size={26} aria-hidden="true" />
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              {index < composition.steps.length - 1 && (
                <ArrowRight className="god-wd-flow-arrow" size={20} aria-hidden="true" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Property chips */}
      <div className="god-wd-props" aria-label="Key material properties">
        {composition.properties.map((prop, index) => (
          <motion.div
            className="god-wd-prop"
            key={prop.label}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.35, delay: reduce ? 0 : index * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            <strong>{prop.label}</strong>
            <span>{prop.text}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
