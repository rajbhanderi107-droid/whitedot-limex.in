/**
 * IndustryApplications — Phase 3 premium rewrite.
 *
 * 8 industry cards with:
 *  - Magnetic hover (x/y spring translation, existing pattern)
 *  - 3D tilt toward cursor (rotateX/rotateY, ±6deg max) via useSpring
 *  - Pointer-tracked sage glow following cursor within the card
 *  - Layered translateZ parallax on icon + label (CSS perspective)
 *  - Click opens ApplicationShowcase modal for that industry
 *
 * Reduced-motion: magnetic + tilt + parallax collapse to simple opacity fade.
 * Cards are <button> elements — keyboard-activatable, cursor:pointer.
 */

import { useCallback, useRef, useState } from "react";
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
  Wind,
  type LucideIcon,
} from "lucide-react";
import {
  ApplicationShowcase,
  type IndustryData,
} from "./ApplicationShowcase";

/* ── Industry data ─────────────────────────────────────────────────────────── */

const industries: IndustryData[] = [
  {
    name: "Packaging",
    slug: "packaging",
    icon: Package,
    note: "Films, pouches and rigid packs with less plastic.",
    tiles: [
      { label: "Stand-up pouch", detail: "Flexible LIMEX-blend pouch. Comparable barrier to BOPP at 30% lower plastic by mass." },
      { label: "Rigid clamshell", detail: "Thermoformed clamshell for food-grade and retail. Runs on existing tooling." },
      { label: "Shrink film", detail: "Calcareous shrink sleeve. Dimensional stability above 80°C." },
    ],
  },
  {
    name: "Stationery",
    slug: "stationery",
    icon: PenTool,
    note: "Folders, sheets and document products.",
    tiles: [
      { label: "A4 document sheet", detail: "Waterproof LIMEX sheet. Tear-resistant; printable on standard offset presses." },
      { label: "Presentation folder", detail: "Rigid spine folder. Surface accepts embossing and foil without laminate." },
      { label: "Binder cover board", detail: "LIMEX board at 200 g/m². Replaces PVC binder shells in corporate formats." },
    ],
  },
  {
    name: "Injection Molding",
    slug: "injection-molding",
    icon: Factory,
    note: "Rigid components on existing molds.",
    tiles: [
      { label: "Thin-wall container lid", detail: "Drop-in LIMEX compound on existing injection tooling. No mold modification." },
      { label: "Industrial pallet foot", detail: "High-load structural foot. Mineral fill improves creep resistance." },
      { label: "Cap and closure", detail: "PP-LIMEX blend cap. Comparable torque values to conventional PP across ±15°C." },
    ],
  },
  {
    name: "Retail",
    slug: "retail",
    icon: ShoppingBag,
    note: "Bags, displays and point-of-sale material.",
    tiles: [
      { label: "Carry bag", detail: "LIMEX-blend carry bag. Heat-sealable; handle tear strength meets EN 13590." },
      { label: "Counter display tray", detail: "Rigid formed tray for POS. Printable surface; no additional liner required." },
      { label: "Hang tag card", detail: "Calcareous card stock. Waterproof; punched and strung on existing lines." },
    ],
  },
  {
    name: "Industrial Sheets",
    slug: "industrial-sheets",
    icon: Layers,
    note: "Thermoformed trays, panels and boards.",
    tiles: [
      { label: "Thermoformed tray", detail: "LIMEX sheet thermoformed into custom trays. Cycle time comparable to HIPS." },
      { label: "Wall panel board", detail: "1.2mm construction board. Moisture-resistant alternative to gypsum-backed sheets." },
      { label: "Partition panel", detail: "Structural partition at 3mm gauge. Lighter than HDPE sheet at equivalent rigidity." },
    ],
  },
  {
    name: "Molded Products",
    slug: "molded-products",
    icon: Box,
    note: "Containers, caps and daily-use goods.",
    tiles: [
      { label: "Blow-molded bottle", detail: "LIMEX-blend extrusion blow. Neck finish compatible with standard PCO-1881 caps." },
      { label: "Storage container", detail: "Injection-molded tub. Drop-tested to 1.2m per ASTM D5276." },
      { label: "Closure disc", detail: "Induction-seal disc in LIMEX compound. Migration tested to EU No 10/2011." },
    ],
  },
  {
    name: "Consumer Goods",
    slug: "consumer-goods",
    icon: Boxes,
    note: "Brandable, repeatable product formats.",
    tiles: [
      { label: "Cosmetic outer carton", detail: "Calcareous carton blank. Gloss or matte laminate-free surface for on-pack print." },
      { label: "Gift box shell", detail: "Rigid folding box in LIMEX board. Embossed brand mark; no additional finishing." },
      { label: "Blister card backing", detail: "LIMEX card backer. Heat-seal bonding to PVC or PET blister without primer." },
    ],
  },
  {
    name: "Food Packaging",
    slug: "food-packaging",
    icon: UtensilsCrossed,
    note: "Cups, containers and service ware.",
    tiles: [
      { label: "Single-use cup", detail: "LIMEX-blend paper-alternative cup. Passed FDA 21 CFR food-contact criteria." },
      { label: "Meal tray", detail: "Thermoformed food tray. Ovenable to 120°C; microwave-compatible variant available." },
      { label: "Lidded portion pot", detail: "Injection-molded portion pot with snap lid. No wax or PFAS coating required." },
    ],
  },
  {
    name: "Woven & Non-Woven Sacks",
    slug: "woven-nonwoven-sacks",
    icon: Wind,
    note: "Sacks and fabric-form products with reduced plastic.",
    tiles: [
      { label: "Woven PP sack", detail: "LIMEX-blend woven polypropylene sack for agricultural, cement and bulk-goods packaging. Comparable tensile and tear strength to conventional woven PP." },
      { label: "Non-woven fabric sack", detail: "LIMEX-integrated non-woven sack for retail, carry and promotional use. Reduced conventional plastic content without compromising weight rating or stitchability." },
      { label: "FIBC / bulk bag liner", detail: "LIMEX compound liner for flexible intermediate bulk containers. Supports moisture resistance and consistent sealing performance." },
    ],
  },
];

/* ── Slug helper ───────────────────────────────────────────────────────────── */

/* ── Individual card ───────────────────────────────────────────────────────── */

interface CardProps {
  industry: IndustryData;
  cellVariants: Variants;
  onOpen: (industry: IndustryData, btn: HTMLButtonElement) => void;
}

function IndustryCard({ industry, cellVariants, onOpen }: CardProps) {
  const { name, note, icon: Icon } = industry;
  const btnRef = useRef<HTMLButtonElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Magnetic translation (existing pattern)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 200, damping: 18 });
  const smy = useSpring(my, { stiffness: 200, damping: 18 });

  // 3D tilt — rotateX/rotateY via spring
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 260, damping: 22 });
  const sry = useSpring(ry, { stiffness: 260, damping: 22 });

  const [isHovered, setIsHovered] = useState(false);

  const onMove = useCallback((e: React.MouseEvent) => {
    if (reduce || !blockRef.current) return;
    const r = blockRef.current.getBoundingClientRect();
    const relX = e.clientX - r.left;
    const relY = e.clientY - r.top;
    const cx = r.width / 2;
    const cy = r.height / 2;

    // Magnetic
    mx.set((relX - cx) * 0.16);
    my.set((relY - cy) * 0.16);

    // Tilt: max ±6deg. Invert Y so cursor-up = positive tilt (card leans toward you)
    ry.set(((relX - cx) / cx) * 6);
    rx.set(-((relY - cy) / cy) * 6);

    // Glow position — written directly to CSS custom property, no React re-render
    blockRef.current.style.setProperty('--gp-x', `${(relX / r.width) * 100}%`);
    blockRef.current.style.setProperty('--gp-y', `${(relY / r.height) * 100}%`);
  }, [reduce, mx, my, rx, ry]);

  const onLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
    rx.set(0);
    ry.set(0);
    setIsHovered(false);
  }, [mx, my, rx, ry]);

  const onEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleClick = useCallback(() => {
    if (btnRef.current) {
      onOpen(industry, btnRef.current);
    }
  }, [industry, onOpen]);

  return (
    <motion.div className="cine-app-cell" variants={cellVariants}>
      {/*
        The outer motion.div handles magnetic translation.
        The inner motion.div handles 3D tilt.
        Both driven by springs for natural deceleration.
      */}
      <motion.div
        className="cine-app-magnetic"
        style={{ x: smx, y: smy }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onMouseEnter={onEnter}
      >
        <motion.div
          ref={blockRef}
          className="cine-app-block ia-card-tilt glass-panel"
          style={{
            rotateX: reduce ? 0 : srx,
            rotateY: reduce ? 0 : sry,
            transformPerspective: 800,
          }}
        >
          {/* The actual interactive button — keyboard-activatable, screen-reader labelled */}
          <button
            ref={btnRef}
            type="button"
            className="ia-card-btn"
            onClick={handleClick}
            aria-label={`View LIMEX applications for ${name}`}
          >
            {/* Icon — elevated Z layer for parallax depth feel */}
            <motion.span
              className="cine-app-icon ia-card-icon"
              style={{
                translateZ: reduce ? 0 : (isHovered ? 12 : 0),
              }}
              aria-hidden="true"
            >
              <Icon size={22} />
            </motion.span>

            {/* Text layer — slightly less elevation than icon */}
            <motion.span
              className="ia-card-text"
              style={{
                translateZ: reduce ? 0 : (isHovered ? 6 : 0),
              }}
            >
              <h3>{name}</h3>
              <p>{note}</p>
            </motion.span>

            {/* "View showcase" affordance — appears on hover */}
            <span className="ia-card-cta" aria-hidden="true">
              View showcase
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
                <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>

          {/* Cursor-tracked sage glow — position via CSS custom props on blockRef, no re-render */}
          <span
            className="cine-app-glow ia-card-glow"
            aria-hidden="true"
            style={{
              left: 'var(--gp-x, 50%)',
              top: 'var(--gp-y, 80%)',
              opacity: isHovered && !reduce ? 1 : 0,
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ── Section ───────────────────────────────────────────────────────────────── */

export function IndustryApplications() {
  const reduce = useReducedMotion();

  const [activeIndustry, setActiveIndustry] = useState<IndustryData | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const handleOpen = useCallback((industry: IndustryData, btn: HTMLButtonElement) => {
    triggerRef.current = btn;
    setActiveIndustry(industry);
  }, []);

  const handleClose = useCallback(() => {
    setActiveIndustry(null);
  }, []);

  const wrap: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };

  const cell: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 26 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <>
      <section className="cine-section cine-apps cine-section--cinematic" id="applications">
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
          viewport={{ once: true, amount: 0.15 }}
        >
          {industries.map((industry) => (
            <IndustryCard
              key={industry.name}
              industry={industry}
              cellVariants={cell}
              onOpen={handleOpen}
            />
          ))}
        </motion.div>
      </section>

      {/* Portal-level modal — rendered outside the section so z-index stacking is clean */}
      <ApplicationShowcase
        industry={activeIndustry}
        triggerRef={triggerRef as React.RefObject<HTMLButtonElement | null>}
        onClose={handleClose}
      />
    </>
  );
}
