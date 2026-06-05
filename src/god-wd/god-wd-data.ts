// GOD-WD data — legal briefs + LIMEX vs local filler comparison.
// Source for comparison: White Dot LLP supplied "TBM vs Local filler mfg" matrix.
// All values are framed for procurement review, not as universal guarantees.

export type BriefCard = {
  name: string;
  role: string;
  text: string;
};

export const legalBriefs: BriefCard[] = [
  {
    name: "TBM Co., Ltd., Japan",
    role: "Inventor, manufacturer and global licensor",
    text: "Developer and manufacturer of LIMEX material, produced in Japan and Vietnam at approximately 10,000 tonnes per month, with half-yearly and yearly certification of material data.",
  },
  {
    name: "Seven Dot Company",
    role: "Sole authorized distributor",
    text: "Appointed directly by TBM Co., Ltd., Japan to distribute LIMEX raw material through the defined and authorized market channel.",
  },
  {
    name: "White Dot LLP",
    role: "Authorized marketing and sales firm",
    text: "Formed to market, distribute, and sell LIMEX raw material across the designated authorized states of Gujarat, Rajasthan, Diu, Daman, and Goa.",
  },
];

// ---------- LIMEX composition (Inside the material) ----------
export const composition = {
  // LIMEX pellet is 50%+ inorganic (limestone-derived CaCO3), balance polymer binder.
  caco3: 50, // percent (minimum) — labelled "50%+"
  resin: 50,
  steps: [
    {
      title: "Limestone (CaCO₃)",
      text: "Abundant inorganic mineral, milled to a fine 2–8 micron powder per grade.",
      icon: "Mountain",
    },
    {
      title: "LIMEX pellet",
      text: "CaCO₃ is compounded with resin into coated pellets that protect the machine.",
      icon: "Boxes",
    },
    {
      title: "Your moulded product",
      text: "Runs on existing plastic lines and takes on the polymer's properties once blended.",
      icon: "PackageCheck",
    },
  ],
  properties: [
    { label: "50%+ inorganic", text: "limestone-derived CaCO₃ content" },
    { label: "2–8 µm mesh", text: "fine, uniform particle size" },
    { label: "Up to 80%", text: "usable loading in the blend" },
    { label: "White ash", text: "low carbon vs commercial filler" },
    { label: "Coated pellets", text: "protect hopper, barrel and screw" },
  ],
};

// ---------- Closing verdict ----------
export const verdict = {
  title: "An engineered material, not a cheap filler.",
  points: [
    "Increases strength and lets you thin walls — material savings on top of plastic reduction.",
    "Supports Extended Producer Responsibility (EPR) claims with TBM-authorized data.",
    "Consistent, high-capacity supply from Japan and Vietnam — not lot-to-lot guesswork.",
  ],
  note: "Local CaCO₃ filler at ₹28–30 looks cheaper on paper, but limited loading, machine wear, and unproven data make the real cost questionable.",
};

export type ComparisonCategory =
  | "Material Science"
  | "Processing & Performance"
  | "Quality & Compliance";

export type ComparisonRow = {
  category: ComparisonCategory;
  label: string;
  // icon name maps to a lucide-react icon in the component
  icon: string;
  limex: string;
  local: string;
};

export const comparisonCategories: ComparisonCategory[] = [
  "Material Science",
  "Processing & Performance",
  "Quality & Compliance",
];

// Standout numbers pulled from the supplied matrix for an at-a-glance strip.
export const keyDifferences: {
  metric: string;
  limex: string;
  local: string;
  note: string;
}[] = [
  {
    metric: "Particle mesh size",
    limex: "2–8 µm",
    local: "50–70 µm",
    note: "Finer, uniform CaCO₃ disperses cleanly into the polymer melt.",
  },
  {
    metric: "Usable dosage",
    limex: "up to 80%",
    local: "max 30%",
    note: "Higher loading without losing the technical behaviour of plastic.",
  },
  {
    metric: "Assured capacity",
    limex: "~10,000 T/M",
    local: "varies",
    note: "Consistent monthly supply from TBM Japan and Vietnam plants.",
  },
  {
    metric: "Ash signature",
    limex: "white ash",
    local: "grey ash",
    note: "Lower carbon content than commercial-grade filler.",
  },
];

export const comparisonRows: ComparisonRow[] = [
  // Material Science
  {
    category: "Material Science",
    label: "Material origin",
    icon: "Globe2",
    limex: "Sustainable material engineered in Japan as an alternate to plastic.",
    local: "No engineered alternative — filler only.",
  },
  {
    category: "Material Science",
    label: "Design intent",
    icon: "Target",
    limex: "Built to reduce plastic consumption while holding technical properties.",
    local: "Added to increase weight, not to modify technical properties.",
  },
  {
    category: "Material Science",
    label: "Composition base",
    icon: "FlaskConical",
    limex: "CaCO₃-based performance additive.",
    local: "Mica or formaldehyde based, with oil and wax.",
  },
  {
    category: "Material Science",
    label: "Mesh / particle size",
    icon: "Microscope",
    limex: "2 to 8 micron depending on grade.",
    local: "50 to 70 micron, oil and wax based.",
  },
  {
    category: "Material Science",
    label: "Density behaviour",
    icon: "Layers",
    limex: "High density increases rigidity and endurance.",
    local: "Does not match the same density standard.",
  },
  {
    category: "Material Science",
    label: "Low-density grade",
    icon: "Feather",
    limex: "Low-density grade available to restrict weight gain.",
    local: "Low-density CaCO₃ not possible — a technology limitation.",
  },
  {
    category: "Material Science",
    label: "Carbon content",
    icon: "Sparkles",
    limex: "Lower than commercial-grade filler — ash remains white.",
    local: "High carbon and ash content — ash remains grey.",
  },
  // Processing & Performance
  {
    category: "Processing & Performance",
    label: "Technical effect",
    icon: "TrendingUp",
    limex: "Increases strength and adds specific performance characteristics.",
    local: "Adds weight but reduces mould or die life and finishing.",
  },
  {
    category: "Processing & Performance",
    label: "Maximum usage",
    icon: "Gauge",
    limex: "Usable up to 80% of the blend.",
    local: "Limited to about 30% when compared as a filler.",
  },
  {
    category: "Processing & Performance",
    label: "Processability",
    icon: "Settings",
    limex: "Processes like plastic — takes on all plastic properties once blended.",
    local: "Lumps cause processing issues that damage mould and finishing.",
  },
  {
    category: "Processing & Performance",
    label: "Physical testing",
    icon: "ClipboardCheck",
    limex: "Drop, impact, and dart tests show better performance.",
    local: "No comparable test data available.",
  },
  {
    category: "Processing & Performance",
    label: "Blow moulding",
    icon: "Wind",
    limex: "Wall thinning reduces weight for double material savings.",
    local: "No defined blow-moulding benefit.",
  },
  {
    category: "Processing & Performance",
    label: "Injection moulding",
    icon: "Syringe",
    limex: "Wall thinning is recommended for best results.",
    local: "No defined injection-moulding benefit.",
  },
  {
    category: "Processing & Performance",
    label: "Pellet coating",
    icon: "ShieldCheck",
    limex: "Coated pellets protect hopper, barrel, and screw — die life is preserved.",
    local: "Non-coated material can damage machine and mould parts.",
  },
  // Quality & Compliance
  {
    category: "Quality & Compliance",
    label: "Manufacturing",
    icon: "Factory",
    limex: "Manufactured in Japan and Vietnam.",
    local: "Local manufacturing exists but quality is not consistent.",
  },
  {
    category: "Quality & Compliance",
    label: "Supply capacity",
    icon: "PackageCheck",
    limex: "Approximately 10,000 tonnes per month.",
    local: "Capacity varies from manufacturer to manufacturer.",
  },
  {
    category: "Quality & Compliance",
    label: "EPR position",
    icon: "Recycle",
    limex: "Supports claims under Extended Producer Responsibility.",
    local: "No established EPR background.",
  },
  {
    category: "Quality & Compliance",
    label: "Authorization",
    icon: "BadgeCheck",
    limex: "TBM Japan authorizes data half-yearly or yearly — data validation is proven.",
    local: "Consultant-led yearly checks with data validation concerns.",
  },
  {
    category: "Quality & Compliance",
    label: "Cost basis",
    icon: "IndianRupee",
    limex: "Priced as an engineered material justified by performance and savings.",
    local: "₹28–30 cost is questionable against PP or PE material economics.",
  },
];
