/**
 * IndustryAnimatedIcons — hand-drawn animated line icons for the
 * Industry Applications grid. Pure SVG + CSS (industry-icons.css):
 * draw-on stroke entry, then a subtle mechanical loop per industry.
 * Reduced-motion users get the static drawn icon.
 */

import "./industry-icons.css";

interface IconProps {
  size?: number;
}

function Svg({ size = 44, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className="ii"
      width={size}
      height={size}
      viewBox="0 0 80 80"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function PackagingIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <g className="ii-anim-boxsettle">
        <path className="draw" d="M16 32 L40 22 L64 32 L64 58 L40 68 L16 58 Z" />
        <path className="draw draw-2" d="M16 32 L40 42 L64 32 M40 42 L40 68" />
        <path className="ii-fine" d="M20 36 L36 43 M44 43 L60 36 M40 47 L40 63" />
        <path className="ii-fine" d="M16 50 L40 60 L64 50" />
      </g>
      <g className="ii-anim-flap">
        <path className="draw draw-3" d="M40 22 L29 13 L51 13 Z" />
        <path className="ii-fine" d="M34 17 L46 17" />
      </g>
    </Svg>
  );
}

export function StationeryIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className="draw" d="M14 62 L66 62" />
      <path className="ii-fine" d="M18 62 L18 58 M26 62 L26 59 M34 62 L34 58 M58 62 L58 58 M50 62 L50 59" />
      <g className="ii-anim-pen">
        <path className="draw draw-2" d="M24 56 L44 20 L52 24 L34 60 L24 62 Z" />
        <path className="draw draw-3" d="M27 51 L37 55" />
        <path className="ii-fine" d="M46 22 L49 23.5 M44 27 L50 30" />
      </g>
      <path className="ii-anim-ink" d="M20 70 L62 70" />
    </Svg>
  );
}

export function InjectionMoldingIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className="draw" d="M14 18 L66 18 M22 18 L22 28 L58 28 L58 18" />
      <path className="ii-fine" d="M26 22 L30 22 M36 22 L44 22 M50 22 L54 22" />
      <g className="ii-anim-ram">
        <path className="draw draw-2" d="M34 28 L34 38 L46 38 L46 28 M40 38 L40 44" />
        <path className="ii-fine" d="M37 31 L43 31 M37 34 L43 34" />
      </g>
      <path className="ii-anim-shot" d="M40 46 L40 51" />
      <path className="draw draw-3" d="M26 58 L26 68 L54 68 L54 58" />
      <path className="ii-fine" d="M26 68 L22 72 M54 68 L58 72 M30 71 L50 71" />
      <path className="ii-anim-mouldfill" d="M29 64 L51 64" />
    </Svg>
  );
}

export function RetailIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className="draw" d="M18 36 L18 66 L62 66 L62 36" />
      <path className="ii-fine" d="M22 62 L30 62 M22 58 L30 58" />
      <g className="ii-anim-awning">
        <path
          className="draw draw-2"
          d="M14 34 L20 20 L60 20 L66 34 M14 34 Q20 40 27 34 Q33 40 40 34 Q47 40 53 34 Q60 40 66 34"
        />
        <path className="ii-fine" d="M27 21 L24 33 M40 21 L40 33 M53 21 L56 33" />
      </g>
      <g className="ii-anim-door">
        <path d="M34 66 L34 50 L46 50 L46 66" />
        <path className="ii-fine" d="M43 58 L43 60" />
      </g>
      <circle className="ii-pop" cx="55" cy="44" r="3.4" style={{ transformOrigin: "55px 44px" }} />
      <path className="ii-fine ii-anim-sparkle" d="M53.5 44 L56.5 44 M55 42.5 L55 45.5" />
    </Svg>
  );
}

export function IndustrialSheetsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <g className="ii-anim-sheetreact">
        <path className="draw" d="M16 52 L40 62 L64 52 L40 42 Z" />
        <path className="draw draw-2" d="M16 42 L40 52 L64 42 L40 32 Z" />
        <path className="ii-fine" d="M24 49 L40 56 L56 49 M24 39 L40 46 L56 39" />
      </g>
      <g className="ii-anim-sheettop">
        <path className="draw draw-3" d="M16 32 L40 42 L64 32 L40 22 Z" />
        <path className="ii-fine" d="M24 29 L40 36 L56 29" />
      </g>
    </Svg>
  );
}

export function MoldedProductsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <g className="ii-anim-clamp-l">
        <path className="draw" d="M30 22 L18 22 L18 58 L30 58 M22 30 L22 50" />
        <path className="ii-fine" d="M25 26 L25 54 M18 26 L14 26 M18 54 L14 54" />
      </g>
      <g className="ii-anim-clamp-r">
        <path className="draw draw-2" d="M50 22 L62 22 L62 58 L50 58 M58 30 L58 50" />
        <path className="ii-fine" d="M55 26 L55 54 M62 26 L66 26 M62 54 L66 54" />
      </g>
      <g className="ii-anim-reveal">
        <path className="draw draw-3" d="M34 32 L46 32 L44 56 L36 56 Z" />
        <path className="ii-fine" d="M36 36 L44 36 M36.5 40 L43.5 40" />
      </g>
    </Svg>
  );
}

export function ConsumerGoodsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <g className="ii-anim-bob">
        <path
          className="draw"
          d="M30 18 L36 18 L36 26 Q42 30 42 38 L42 62 Q42 66 38 66 L28 66 Q24 66 24 62 L24 38 Q24 30 30 26 Z"
        />
        <path className="draw draw-3" d="M28 44 L38 44" />
        <path className="ii-fine" d="M28 48 L38 48 M28 52 L34 52 M31 18 L31 25" />
      </g>
      <g className="ii-anim-bob2">
        <path className="draw draw-2" d="M46 38 L66 38 L66 66 L46 66 Z M46 46 L66 46" />
        <path className="ii-fine" d="M50 52 L62 52 M50 56 L58 56 M53 38 L53 46 M59 38 L59 46" />
      </g>
    </Svg>
  );
}

export function FoodPackagingIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <g className="ii-anim-lidpeel">
        <path className="draw" d="M14 46 L66 46" />
      </g>
      <path className="draw draw-2" d="M18 46 L62 46 L58 66 L22 66 Z" />
      <path className="ii-fine" d="M24 52 L56 52 M25.5 58 L54.5 58 M27 63 L53 63" />
      <path className="draw draw-3" d="M40 46 Q40 36 30 34 M40 46 Q40 32 50 30" />
      <path className="ii-fine" d="M30 34 Q34 38 36 44 M50 30 Q45 36 43 44" />
      <path className="ii-anim-steam-1" d="M33 24 Q31 20 33 16" />
      <path className="ii-anim-steam-2" d="M41 25 Q43 21 41 17" />
      <path className="ii-anim-steam-3" d="M48 24 Q46 20 48 16" />
    </Svg>
  );
}

export function WovenSacksIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className="draw" d="M18 18 L62 18 L62 62 L18 62 Z" />
      <path className="ii-fine" d="M18 24 L62 24 M18 56 L62 56 M24 18 L24 62 M56 18 L56 62" />
      <path className="ii-anim-weft-1" d="M18 30 Q30 24 40 30 Q50 36 62 30" />
      <path className="ii-anim-weft-2" d="M18 44 Q30 38 40 44 Q50 50 62 44" />
      <path className="ii-fine ii-anim-weft-3" d="M18 37 Q30 32 40 37 Q50 42 62 37" />
      <path className="draw draw-3" style={{ opacity: 0.7 }} d="M30 18 L30 62 M50 18 L50 62" />
      <circle className="ii-dot ii-anim-shuttle" cx="16" cy="56" r="2.2" />
    </Svg>
  );
}

/** Slug → animated icon component, matching IndustryData slugs. */
export const industryAnimatedIcons: Record<string, (p: IconProps) => React.JSX.Element> = {
  packaging: PackagingIcon,
  stationery: StationeryIcon,
  "injection-molding": InjectionMoldingIcon,
  retail: RetailIcon,
  "industrial-sheets": IndustrialSheetsIcon,
  "molded-products": MoldedProductsIcon,
  "consumer-goods": ConsumerGoodsIcon,
  "food-packaging": FoodPackagingIcon,
  "woven-nonwoven-sacks": WovenSacksIcon,
};
