type IndustryIconName =
  | 'packaging'
  | 'stationery'
  | 'injection'
  | 'retail'
  | 'sheets'
  | 'molded'
  | 'consumer'
  | 'food'
  | 'sacks';

interface IndustryAnimatedIconProps {
  name: IndustryIconName;
  className?: string;
}

function PackagingIcon() {
  return (
    <>
      <path className="ia-secondary ia-pack-sheet" d="M27 75h50l7 12H34z" />
      <path className="ia-primary ia-pack-box" d="M30 36h56v40H30z" />
      <path className="ia-primary ia-pack-flap" d="M30 36l14-13h56L86 36z" />
      <path className="ia-detail" d="M48 43h20M48 52h28M48 61h18" />
      <path className="ia-detail ia-pack-tape" d="M58 23v53" />
      <path className="ia-detail" d="M86 36l-28 0" />
    </>
  );
}

function StationeryIcon() {
  return (
    <>
      <path className="ia-secondary ia-paper-low" d="M34 26h44v62H34z" />
      <path className="ia-primary ia-paper-top" d="M40 20h44v62H40z" />
      <path className="ia-detail ia-ink" d="M49 36h24M49 47h28M49 58h18" />
      <path className="ia-detail" d="M78 20v12h6M47 72h22" />
      <path className="ia-primary ia-pen" d="M28 84l8-3 35-35-5-5-35 35z" />
    </>
  );
}

function InjectionIcon() {
  return (
    <>
      <path className="ia-secondary" d="M30 32h22v48H30zM64 32h22v48H64z" />
      <path className="ia-primary ia-mold-left" d="M34 40h18v32H34z" />
      <path className="ia-primary ia-mold-right" d="M64 40h18v32H64z" />
      <path className="ia-detail" d="M52 50h12M52 62h12M30 26h56" />
      <path className="ia-primary ia-ram" d="M53 18h10v20H53z" />
      <path className="ia-secondary ia-melt" d="M58 39c4 6 8 11 8 17 0 5-4 9-8 9s-8-4-8-9c0-6 4-11 8-17z" />
      <path className="ia-detail ia-fill" d="M42 67h32" />
    </>
  );
}

function RetailIcon() {
  return (
    <>
      <path className="ia-primary ia-store-awning" d="M26 36h64l-6-13H32z" />
      <path className="ia-detail" d="M36 23v13M48 23v13M60 23v13M72 23v13" />
      <path className="ia-secondary" d="M32 36h52v48H32z" />
      <path className="ia-primary ia-door" d="M41 51h17v33H41z" />
      <path className="ia-detail" d="M65 51h13M65 62h13M65 73h13" />
      <circle className="ia-secondary ia-dot-pop" cx="54" cy="67" r="2" />
    </>
  );
}

function SheetsIcon() {
  return (
    <>
      <path className="ia-secondary ia-sheet-3" d="M25 52h50l14 22H39z" />
      <path className="ia-secondary ia-sheet-2" d="M31 42h50l14 22H45z" />
      <path className="ia-primary ia-sheet-1" d="M37 31h50l14 22H51z" />
      <path className="ia-detail" d="M50 39h31M58 48h31M39 63h31M45 73h31" />
      <path className="ia-detail ia-ruler" d="M27 86h54M35 82v4M45 80v6M55 82v4M65 80v6M75 82v4" />
    </>
  );
}

function MoldedIcon() {
  return (
    <>
      <path className="ia-secondary" d="M30 37h22v39H30zM64 37h22v39H64z" />
      <path className="ia-detail" d="M30 30h56M30 83h56M39 30v-8M77 30v-8" />
      <path className="ia-primary ia-mold-open-left" d="M39 45h14v23H39z" />
      <path className="ia-primary ia-mold-open-right" d="M63 45h14v23H63z" />
      <path className="ia-secondary ia-product-pop" d="M51 50h14c6 0 11 5 11 11s-5 11-11 11H51z" />
      <path className="ia-detail" d="M56 56h11M56 64h14" />
    </>
  );
}

function ConsumerIcon() {
  return (
    <>
      <path className="ia-primary ia-gift-box" d="M31 42h54v39H31z" />
      <path className="ia-primary ia-gift-lid" d="M28 33h60v12H28z" />
      <path className="ia-detail" d="M58 33v48M31 55h54M43 63h14M63 63h12M43 72h31" />
      <path className="ia-secondary ia-bow-left" d="M58 33c-12-12-24-7-16 0 5 4 11 2 16 0z" />
      <path className="ia-secondary ia-bow-right" d="M58 33c12-12 24-7 16 0-5 4-11 2-16 0z" />
    </>
  );
}

function FoodIcon() {
  return (
    <>
      <path className="ia-secondary ia-steam ia-steam-1" d="M43 24c-5 7 5 10 0 17" />
      <path className="ia-secondary ia-steam ia-steam-2" d="M58 20c-6 8 6 12 0 20" />
      <path className="ia-secondary ia-steam ia-steam-3" d="M73 24c-5 7 5 10 0 17" />
      <path className="ia-primary ia-tray" d="M30 50h56l-6 30H36z" />
      <path className="ia-detail" d="M37 60h42M41 69h34" />
      <path className="ia-secondary ia-lid" d="M36 42h44l6 8H30z" />
      <path className="ia-detail" d="M49 50v28M66 50v28" />
    </>
  );
}

function SacksIcon() {
  return (
    <>
      <path className="ia-primary ia-sack" d="M36 28h42l7 55H29z" />
      <path className="ia-detail" d="M42 28c3 7 29 7 32 0M42 39h31M39 50h37M36 61h43M34 72h47" />
      <path className="ia-detail" d="M45 32v47M58 32v47M71 32v47" />
      <circle className="ia-secondary ia-shuttle" cx="39" cy="61" r="3" />
      <path className="ia-secondary" d="M29 84h56" />
    </>
  );
}

export default function IndustryAnimatedIcon({ name, className = '' }: IndustryAnimatedIconProps) {
  const content = {
    packaging: <PackagingIcon />,
    stationery: <StationeryIcon />,
    injection: <InjectionIcon />,
    retail: <RetailIcon />,
    sheets: <SheetsIcon />,
    molded: <MoldedIcon />,
    consumer: <ConsumerIcon />,
    food: <FoodIcon />,
    sacks: <SacksIcon />,
  }[name];

  return (
    <svg
      className={`v2ap-industry-icon v2ap-industry-icon--${name} ${className}`}
      viewBox="0 0 116 116"
      role="img"
      aria-hidden="true"
      focusable="false"
      shapeRendering="geometricPrecision"
    >
      <defs>
        <filter id={`ia-glow-${name}`} x="-45%" y="-45%" width="190%" height="190%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#4f9a35" floodOpacity="0.42" />
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#4f9a35" floodOpacity="0.26" />
          <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="#4f9a35" floodOpacity="0.16" />
        </filter>
      </defs>
      <g className="ia-stage" filter={`url(#ia-glow-${name})`}>
        {content}
      </g>
    </svg>
  );
}

export type { IndustryIconName };
