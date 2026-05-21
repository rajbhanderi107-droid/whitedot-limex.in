import { motion, useReducedMotion } from "framer-motion";

const rockSrc = `${import.meta.env.BASE_URL}assets/limex-rock.webp`;

/**
 * The LIMEX limestone/calcium-carbonate rock — the brand's material object.
 * Shared so the same visual appears across sections (detail, material
 * intelligence, material core). Lightweight (a single webp + CSS glow), so it
 * is far cheaper than a WebGL canvas and safe to render in multiple places.
 *
 * `variant` adds a context class for sizing; floating is disabled under
 * prefers-reduced-motion.
 */
export function LimexRock({ variant = "" }: { variant?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={`cine-rock ${variant}`} aria-hidden="true">
      <motion.img
        src={rockSrc}
        alt=""
        loading="lazy"
        decoding="async"
        className={`cine-rock-img${reduce ? " is-static" : ""}`}
      />
      <span className="cine-rock-glow" />
    </div>
  );
}
