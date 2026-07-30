import { Landmark, Layers, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { legalBriefs } from "./god-wd-data";

const ENABLED = import.meta.env.VITE_WD_GOD_ENABLED !== "false";

const briefIcons = [Landmark, Layers, ShieldCheck];

export function LegalBriefs() {
  if (!ENABLED) return null;
  const reduce = useReducedMotion();

  return (
    <section className="section god-wd-briefs" id="authorization-brief" aria-label="Authorized supply chain brief">
      <div className="section-kicker">
        <ShieldCheck size={18} />
        Authorized supply chain
      </div>
      <div className="split-heading">
        <h2>One authorized line from the inventor to your factory.</h2>
        <p>
          LIMEX material reaches Indian industries through a single, documented chain of
          authorization. Each party below holds a defined and verifiable role.
        </p>
      </div>
      <div className="god-wd-brief-grid" aria-label="TBM, Seven Dot, and White Dot roles">
        {legalBriefs.map((brief, index) => {
          const Icon = briefIcons[index] ?? ShieldCheck;
          return (
            <motion.article
              className="god-wd-brief-card"
              key={brief.name}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: reduce ? 0 : index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="god-wd-brief-step" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Icon className="god-wd-brief-icon" size={22} aria-hidden="true" />
              <h3>{brief.name}</h3>
              <strong>{brief.role}</strong>
              <p>{brief.text}</p>
              {index < legalBriefs.length - 1 && (
                <span className="god-wd-brief-arrow" aria-hidden="true" />
              )}
            </motion.article>
          );
        })}
      </div>
      <p className="god-wd-brief-note">
        White Dot markets and sells LIMEX raw material only. TBM Co., Ltd. and Seven Dot
        Company names are used to describe the authorized supply chain.
      </p>
    </section>
  );
}
