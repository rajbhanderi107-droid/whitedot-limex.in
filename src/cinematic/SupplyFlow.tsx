import { Fragment, type CSSProperties } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

const chain = [
  { name: "TBM Co., Ltd.", role: "Japan · inventor & manufacturer" },
  { name: "Seven Dot", role: "Authorized distributor" },
  { name: "White Dot LLP", role: "Marketing & sales · sister company" },
];

const links = ["supplies LIMEX", "marketed & sold by"];

/** Animated origin roadmap with staggered reveal, drawing connectors,
 *  and a signal that pulses along the chain. */
export function SupplyFlow() {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.16, delayChildren: 0.45 } },
  };
  const nodeV: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.94, filter: "blur(6px)" },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };
  const linkV: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.4 } },
  };
  const drawV: Variants = {
    hidden: reduce ? { opacity: 0 } : { scaleX: 0 },
    show: { scaleX: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <motion.div
      className="cine-flow"
      variants={container}
      initial="hidden"
      animate="show"
      aria-label="Where LIMEX comes from: TBM manufactures it, Seven Dot distributes it, White Dot LLP markets and sells it."
    >
      {chain.map((node, i) => (
        <Fragment key={node.name}>
          <motion.div
            className="cine-flow-node"
            variants={nodeV}
            style={{ "--i": i } as CSSProperties}
          >
            <span className="cine-flow-step">{String(i + 1).padStart(2, "0")}</span>
            <strong>{node.name}</strong>
            <span className="cine-flow-role">{node.role}</span>
          </motion.div>
          {i < chain.length - 1 && (
            <motion.span className="cine-flow-link" variants={linkV} aria-hidden="true">
              <span className="cine-flow-label">{links[i]}</span>
              <span className="cine-flow-track">
                <motion.i className="cine-flow-draw" variants={drawV} />
                <i className="cine-flow-pulse" style={{ animationDelay: `${i * 1.2}s` }} />
              </span>
            </motion.span>
          )}
        </Fragment>
      ))}
    </motion.div>
  );
}
