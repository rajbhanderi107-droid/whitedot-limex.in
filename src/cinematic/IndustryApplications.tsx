import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Variants,
} from "framer-motion";
import {
  Box,
  Boxes,
  Factory,
  Layers,
  Package,
  PenTool,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

const industries: { name: string; note: string; icon: LucideIcon }[] = [
  { name: "Packaging", note: "Films, pouches and rigid packs with less plastic.", icon: Package },
  { name: "Stationery", note: "Folders, sheets and document products.", icon: PenTool },
  { name: "Injection Molding", note: "Rigid components on existing molds.", icon: Factory },
  { name: "Retail", note: "Bags, displays and point-of-sale material.", icon: ShoppingBag },
  { name: "Industrial Sheets", note: "Thermoformed trays, panels and boards.", icon: Layers },
  { name: "Molded Products", note: "Containers, caps and daily-use goods.", icon: Box },
  { name: "Consumer Goods", note: "Brandable, repeatable product formats.", icon: Boxes },
  { name: "Food Packaging", note: "Cups, containers and service ware.", icon: UtensilsCrossed },
];

function MagneticBlock({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18 });
  const sy = useSpring(y, { stiffness: 200, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.16);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.16);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className="cine-app-block"
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {children}
    </motion.div>
  );
}

export function IndustryApplications() {
  const reduce = useReducedMotion();
  const wrap: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const cell: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 26 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section className="cine-section cine-apps" id="applications">
      <span className="cine-kicker">Industry Applications</span>
      <h2>One material, across the things you make.</h2>
      <p className="lead">
        LIMEX adapts across high-volume manufacturing routes — wherever plastic dependency can be
        reduced without re-tooling the line.
      </p>

      <motion.div
        className="cine-app-grid"
        variants={wrap}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {industries.map(({ name, note, icon: Icon }) => (
          <motion.div className="cine-app-cell" variants={cell} key={name}>
            <MagneticBlock>
              <span className="cine-app-icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <h3>{name}</h3>
              <p>{note}</p>
              <span className="cine-app-glow" aria-hidden="true" />
            </MagneticBlock>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
