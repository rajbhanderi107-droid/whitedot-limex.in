import {
  ArrowRight,
  Building2,
  BookOpen,
  ChevronDown,
  Factory,
  Globe2,
  Landmark,
  Leaf,
  MapPin,
  MessageCircle,
  Recycle,
  ShieldCheck,
  Sparkles,
  Split,
  Target,
} from "lucide-react";
import { useState } from "react";

// CONTINUITY-WD-BEGIN imports
import { ContinuityShell } from "./continuity-wd";
import "./continuity-wd/continuity-wd.css";
// CONTINUITY-WD-END imports

// AGGREGATION-WD-BEGIN imports
import { AggregationLoader } from "./aggregation-wd";
import "./aggregation-wd/aggregation-wd.css";
// AGGREGATION-WD-END imports
// GOD-WD-BEGIN imports
import { LegalBriefs, LimexComposition, LimexComparison } from "./god-wd";
import "./god-wd/god-wd.css";
// GOD-WD-END imports
import "./mobile.css";

const whatsappNumber = "918849728938";
const whatsappMessage =
  "Hello White Dot LLP, I want to discuss LIMEX material supply, samples, and pricing for my business.";
const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path}`.replace(/\/{2,}/g, "/");

const authorizationChain = [
  {
    title: "TBM Co., Ltd., Japan",
    role: "Manufacturer and Global Licensor",
    text: "Original developer, manufacturer, and global licensor of LIMEX material technology.",
    action: "Grants Distributor Dealership",
  },
  {
    title: "Seven Dot Company",
    role: "Sole Authorized Distributor",
    text: "Authorized directly by TBM Co., Ltd., Japan to distribute LIMEX material through the defined market channel.",
    action: "Supply Agreement",
  },
  {
    title: "White Dot LLP",
    role: "Authorized Marketing and Sales Firm",
    text: "Formed to market, distribute, and sell LIMEX raw material across designated states.",
    action: "Sells to",
  },
  {
    title: "Industries and Businesses",
    role: "Authorized-State End Clients",
    text: "Industrial buyers, processors, institutions, and businesses seeking authorized LIMEX supply.",
    action: "",
  },
];

const productCategories = [
  {
    name: "Injection Mould",
    items: [
      "Sustainable amenities (hotel toothbrushes, combs, razors)",
      "Daily stationery goods (rulers, ballpoint pens, organizers)",
      "Food service tableware (reusable cups, trays, plates)"
    ]
  },
  {
    name: "Blow Mould [Bottle, Cans and Drums]",
    items: [
      "Rigid cosmetic packaging (shampoo and lotion bottles)",
      "Household chemical containers (cleaners, detergents)",
      "Industrial canisters, motor oil cans, and storage drums"
    ]
  },
  {
    name: "Blow Mould [Bags]",
    items: [
      "Eco-friendly retail carrier bags and shopping bags",
      "Heavy-duty garbage bags and bin liners",
      "Agricultural protective bags and film packaging"
    ]
  },
  {
    name: "Thermoforming",
    items: [
      "Rigid food trays (meat trays, bento boxes, fruit punnets)",
      "Disposable cups, lids, and take-away containers",
      "Industrial blister packaging and protective clamshells"
    ]
  },
  {
    name: "Woven Sac",
    items: [
      "Heavy-duty logistics sacs (fertilizer, cement, sand bags)",
      "Bulk agricultural sacs (grain, sugar, flour packaging)",
      "Industrial woven sheets and geo-textile coverings"
    ]
  },
  {
    name: "Non Woven Sac",
    items: [
      "Reusable shopping bags and promotional carry totes",
      "Protective dust covers for garments and footwear",
      "Disposable medical gowns and hygiene sheets"
    ]
  },
  {
    name: "Sealant Packing",
    items: [
      "Industrial sealant cartridges and adhesive tubes",
      "High-precision sealing gaskets and industrial rings",
      "Container caps, closures, and inner liners"
    ]
  },
  {
    name: "Industrial Molded Goods",
    items: [
      "Heavy-duty transport pallets and shipping crates",
      "Automotive interior parts and dashboard components",
      "Construction structural spacers and temporary blocks"
    ]
  },
  {
    name: "FMCG Packing",
    items: [
      "Flexible packaging films and stand-up pouches",
      "Laminated sachets and product wrappers",
      "Toothpaste tubes and squeezable cosmetic tubes"
    ]
  }
];

const proofCards = [
  { value: "50%+", label: "inorganic content such as calcium carbonate in LIMEX material" },
  { value: "97%", label: "approximate water-use reduction cited for sheet alternatives versus paper" },
  { value: "53%", label: "approximate plastic reduction cited for PP-based spunbond fabric use cases" },
  { value: "23%", label: "approximate GHG reduction cited for LimeAir garbage bag examples" },
];

const scaleMetrics = [
  {
    value: "150+",
    label: "molding partners",
    text: "TBM material shows LIMEX applications spanning molding routes through more than 150 molding partners.",
  },
  {
    value: "350+",
    label: "printing partners",
    text: "Printing and sheet use cases are supported by a broad partner base, useful for POP, menus, labels, and signage.",
  },
  {
    value: "500+",
    label: "product partners",
    text: "TBM describes final product development with more than 500 partners across business-ready product formats.",
  },
  {
    value: "10,000+",
    label: "companies and municipalities",
    text: "TBM references social implementation across more than 10,000 companies and municipalities for LIMEX materials and products.",
  },
];

const limexReferences = [
  {
    title: "File folders and document products",
    text: "LIMEX Sheet can be formed into file folders and document items where durability, water resistance, and plastic reduction are important.",
    tag: "Office and institutional use",
  },
  {
    title: "Bags and daily-use packaging",
    text: "Product references include garbage bags, shopping bags, square-bottom bags, and other formats where plastic replacement can be studied.",
    tag: "Retail and municipal use",
  },
  {
    title: "Printed media and POP",
    text: "Menu cards, POP displays, posters, maps, calendars, labels, and stickers show the material's use in print and sales-promotion formats.",
    tag: "Print and display",
  },
  {
    title: "Containers and molded products",
    text: "Food containers, cups, spray bottles, cosmetic containers, fans, and daily-use goods show how LIMEX can be evaluated beyond sheet products.",
    tag: "Molded applications",
  },
  {
    title: "Film and packing formats",
    text: "Sealant film and related packing formats provide useful reference points for manufacturers exploring resin-based applications.",
    tag: "Packaging development",
  },
  {
    title: "Industrial and partner-led development",
    text: "The product references show a broad development path across sheets, bags, containers, signage, and practical business-ready formats.",
    tag: "Product qualification",
  },
];

const productEvidence = [
  {
    title: "LIMEX spunbond nonwoven fabric",
    metrics: ["53% plastic reduction", "38% GHG reduction", "70% possible dosage"],
    text: "For a PP-based spunbond fabric example, TBM cites LIMEX Pellet 70% plus PP 30% reducing petroleum-derived plastic by 527 kg and GHG emissions by 2,502 kg per ton versus PP100%.",
  },
  {
    title: "Backlit film signage",
    metrics: ["55% plastic reduction", "43% GHG reduction", "15% cost potential"],
    text: "The 200 micrometer translucent hard backlit film example is positioned against PET sheet materials, with strong light diffusion and transmittance for illuminated signage.",
  },
  {
    title: "LimeAir garbage bags",
    metrics: ["27% plastic reduction", "23% GHG reduction", "PE bag comparison"],
    text: "The garbage bag material is presented as a limestone-containing option for weight reduction, cost benefits, and adequate durability versus conventional PE garbage bags.",
  },
  {
    title: "LIMEX sheets and printed media",
    metrics: ["97% water reduction", "150 micrometer sheet LCA", "35%-57% plastic reduction"],
    text: "For sheet alternatives, TBM cites very low water use versus paper and plastic-use reductions versus PP and PET sheet comparisons under stated LCA conditions.",
  },
];

const audience = [
  {
    icon: Factory,
    title: "Factories and processors",
    text: "Sample-led conversations for bag makers, plastic processors, pipe, packaging, and industrial product teams.",
  },
  {
    icon: Landmark,
    title: "Government and institutions",
    text: "Clear education material for plastic-reduction, circularity, procurement, and infrastructure discussions.",
  },
  {
    icon: Building2,
    title: "Retail and market channels",
    text: "Practical product formats for shops, city markets, village demand, signage, and repeat daily-use products.",
  },
];

const materialExplainers = [
  {
    title: "Product qualification",
    text: "Start with the buyer's product, thickness, resin system, machine setup, volume, quality needs, and target price.",
  },
  {
    title: "Circular Pathway",
    text: "Plan early for collection, sorting, reuse, and recycling so the material change can support a practical circular path later.",
  },
  {
    title: "Future development",
    text: "Keep future options open, including plastic reduction, recycled content, carbon-reduced materials, and new product formats.",
  },
];

const educationSteps = [
  "Understand product requirement",
  "Check LIMEX suitability",
  "Sample / trial development",
  "Product testing",
  "Commercial adoption",
  "Future circular pathway",
];

const sourceLinks = [
  { label: "LIMEX product cases", href: "https://limex.tb-m.com/en/case/" },
  { label: "LIMEX product site", href: "https://limex.tb-m.com/en/" },
  { label: "LIMEX Sheet guide", href: "https://tb-m.com/doc/limex_sheet_guide_eng.pdf" },
  { label: "LIMEX label guideline", href: "https://tb-m.com/doc/guidelines_limexlabel_en.pdf" },
];



function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <main>
      {/* CONTINUITY-WD-BEGIN overlay */}
      <ContinuityShell />
      {/* CONTINUITY-WD-END overlay */}
      {/* AGGREGATION-WD-BEGIN loader */}
      <AggregationLoader />
      {/* AGGREGATION-WD-END loader */}
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="brand" href="#home" aria-label="White Dot LLP home" onClick={closeMenu}>
          <img className="brand-symbol" src={assetPath("assets/whitedot-logo-enhanced.svg")} alt="" />
          <span className="brand-wordmark">
            <span className="brand-name">White Dot</span>
            <small>LLP</small>
          </span>
        </a>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#authorization">Authorization</a>
          <a href="#material">Material</a>
          {/* GOD-WD-BEGIN nav-link */}
          <a href="#limex-vs-fillers">vs Fillers</a>
          {/* GOD-WD-END nav-link */}
          <a href="#education">Education</a>
          <a href="#impact-data">Impact</a>
          <a href="#applications">Applications</a>
          <a href="#contact">Contact</a>
        </div>
        <a className="nav-action" href={whatsappHref} target="_blank" rel="noreferrer">
          <MessageCircle size={18} />
          WhatsApp
        </a>
        {/* Hamburger — mobile only */}
        <button
          className={`nav-hamburger${menuOpen ? " open" : ""}`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`mobile-nav-overlay${menuOpen ? " open" : ""}`}
        aria-hidden="true"
        onClick={closeMenu}
      />
      <nav
        className={`mobile-nav-drawer${menuOpen ? " open" : ""}`}
        aria-label="Mobile navigation"
      >
        <a href="#about" onClick={closeMenu}>About</a>
        <a href="#authorization" onClick={closeMenu}>Authorization</a>
        <a href="#material" onClick={closeMenu}>Material</a>
        <a href="#limex-vs-fillers" onClick={closeMenu}>vs Fillers</a>
        <a href="#education" onClick={closeMenu}>Education</a>
        <a href="#impact-data" onClick={closeMenu}>Impact</a>
        <a href="#applications" onClick={closeMenu}>Applications</a>
        <a href="#contact" onClick={closeMenu}>Contact</a>
        <a
          className="mobile-nav-cta"
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          onClick={closeMenu}
        >
          <MessageCircle size={18} />
          WhatsApp Us
        </a>
      </nav>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">Authorized supply. Clear material guidance.</p>
          <h1>Sustainable Material to Replace Plastic.</h1>
          <p className="hero-text">
            Sevendot connects businesses with authorized access to LIMEX material technology by TBM
            Japan, helping manufacturers evaluate mineral-based material routes for smarter,
            high-performance industrial and commercial applications.
          </p>
          <div className="hero-actions">
            <a className="button primary" href={whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle size={20} />
              Start a <span className="wd-limex">LIMEX</span> inquiry
            </a>
            <a className="button secondary" href="#authorization">
              View authorization
              <ArrowRight size={19} />
            </a>
          </div>
        </div>
        <div className="territory-panel" aria-label="White Dot LLP authorized territory">
          <div className="territory-head">
            <MapPin size={22} />
            <div>
              <strong>Designated authorized states</strong>
              <span>Market-ready structure with defined state coverage</span>
            </div>
          </div>
          <div className="territory-map" aria-hidden="true">
            <img className="india-map" src={assetPath("assets/india-map-source.svg")} alt="" />
            <span className="state-highlight rajasthan" />
            <span className="state-highlight gujarat" />
            <span className="state-highlight diu" />
            <span className="state-highlight daman" />
            <span className="state-highlight goa" />
            <span className="dealership-glow rajasthan" />
            <span className="dealership-glow gujarat" />
            <span className="dealership-glow diu" />
            <span className="dealership-glow daman" />
            <span className="dealership-glow goa" />
            <span className="state-node rajasthan">Rajasthan</span>
            <span className="state-node gujarat">Gujarat</span>
            <span className="state-node diu">Diu</span>
            <span className="state-node daman">Daman</span>
            <span className="state-node goa">Goa</span>
          </div>
        </div>
      </section>

      {/* GOD-WD-BEGIN briefs */}
      <LegalBriefs />
      {/* GOD-WD-END briefs */}

      <section className="section about" id="about">
        <div className="section-kicker">
          <Building2 size={18} />
          About White Dot LLP
        </div>
        <div className="section-grid">
          <div>
            <h2>A focused commercial platform for LIMEX material.</h2>
          </div>
          <div className="section-copy">
            <p>
              White Dot LLP helps industries evaluate LIMEX material for plastic replacement
              and selected sustainable product applications. The company focuses on material
              guidance, product-fit discussions, sampling coordination, and authorized sales support.
            </p>
          </div>
        </div>
      </section>

      <section className="section authorization" id="authorization">
        <div className="section-kicker">
          <ShieldCheck size={18} />
          Authorization chain
        </div>
        <div className="split-heading">
          <h2>An authorized distribution and marketing chain for industries.</h2>
          <p>
            The market structure is defined by a formal authorization chain from the LIMEX technology
            provider in Japan to the authorized distributor and then to our company for
            marketing and sales in designated states.
          </p>
        </div>
        <div className="authorization-chain" aria-label="TBM Japan to White Dot LLP authorization chain">
          {authorizationChain.map((item) => (
            <article className="authorization-card" key={item.title}>
              <span className="chain-step">{item.action}</span>
              <h3>{item.title}</h3>
              <strong>{item.role}</strong>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section material" id="material">
        <div className="section-kicker">
          <Leaf size={18} />
          LIMEX material
        </div>
        <div className="section-grid">
          <div>
            <h2>A globally recognized sustainable raw material developed in Japan.</h2>
          </div>
          <div className="section-copy">
            <p>
              Developed by TBM Co., Ltd., Japan, LIMEX can be adapted for resin-based and
              paper-substrate applications, offering businesses a versatile material platform for
              packaging, printing, industrial products, and commercial use cases.
            </p>
          </div>
        </div>
        <div className="proof-grid">
          {proofCards.map((item) => (
            <article className="proof-card" key={item.value}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
        <div className="scale-strip" aria-label="TBM scale reference numbers">
          {scaleMetrics.map((metric) => (
            <article key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
              <p>{metric.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* GOD-WD-BEGIN composition */}
      <LimexComposition />
      {/* GOD-WD-END composition */}

      {/* GOD-WD-BEGIN comparison */}
      <LimexComparison />
      {/* GOD-WD-END comparison */}

      <section className="section education" id="education">
        <div className="section-kicker">
          <BookOpen size={18} />
          Client education for adoption
        </div>
        <div className="split-heading">
          <h2>A simple adoption path helps buyers decide with confidence.</h2>
          <p>
            Our team explains LIMEX in practical terms: what product you make, whether the material
            may fit, how trials should run, and what steps are needed before commercial adoption.
          </p>
        </div>
        <div className="education-grid">
          {materialExplainers.map((item) => (
            <article className="detail-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <div className="adoption-panel">
          <div>
            <Target size={24} />
            <h3>LIMEX adoption conversation</h3>
            <p>
              A buyer should test the material step by step before changing production or making
              product claims. This keeps the decision clear and practical.
            </p>
          </div>
          <ol className="roadmap" aria-label="LIMEX adoption roadmap">
            {educationSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section impact-data" id="impact-data">
        <div className="section-kicker">
          <Target size={18} />
          Project material numbers
        </div>
        <div className="split-heading">
          <h2>Use numeric proof to educate factories before they change material.</h2>
          <p>
            These values come from the supplied TBM product PDFs and official material references.
            They should be shown as approximate, product-specific LCA examples rather than universal guarantees.
          </p>
        </div>
        <div className="data-grid">
          {productEvidence.map((item) => (
            <article className="data-card" key={item.title}>
              <h3>{item.title}</h3>
              <div className="metric-pills">
                {item.metrics.map((metric) => (
                  <span key={metric}>{metric}</span>
                ))}
              </div>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <p className="data-note">
          White Dot LLP should collect each buyer's resin, thickness, gsm, machine, annual quantity, and target price,
          then present trial-specific impact estimates before making public environmental claims.
        </p>
      </section>

      <section className="section limex-references" id="limex-references">
        <div className="section-kicker">
          <Split size={18} />
          LIMEX references
        </div>
        <div className="split-heading">
          <h2>Practical LIMEX product references for industrial discussion.</h2>
          <p>
            These references focus on product formats and use cases shown in official LIMEX material.
            They are useful starting points for manufacturers exploring plastic replacement and
            sustainable product development.
          </p>
        </div>
        <div className="reference-grid" aria-label="LIMEX application and product references">
          {limexReferences.map((reference) => (
            <article className="reference-card" key={reference.title}>
              <span>{reference.tag}</span>
              <h3>{reference.title}</h3>
              <p>{reference.text}</p>
            </article>
          ))}
        </div>
        <div className="source-panel">
          <div>
            <Globe2 size={21} />
            <strong>Reference sources</strong>
            <span>Use official TBM material for public claims, labeling, and launch content.</span>
          </div>
          <div className="source-links">
            {sourceLinks.map((source) => (
              <a key={source.href} href={source.href} target="_blank" rel="noreferrer">
                {source.label}
                <ArrowRight size={15} />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section applications" id="applications">
        <div className="section-kicker">
          <Sparkles size={18} />
          Product possibilities
        </div>
        <div className="split-heading">
          <h2>Plastic Replacement Possibilities with LIMEX Material</h2>
          <p>
            Use these categories to plan focused sample discussions for high-volume manufacturing,
            packaging, molded goods, and brand-facing product replacement.
          </p>
        </div>
        <div className="accordion-grid" aria-label="LIMEX product possibility categories">
          {productCategories.map((category) => (
            <details className="product-accordion" key={category.name}>
              <summary>
                <span>{category.name}</span>
                <ChevronDown size={19} aria-hidden="true" />
              </summary>
              <ul>
                {category.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>

      <section className="section why" id="why-whitedot">
        <div className="section-kicker">
          <Recycle size={18} />
          Why White Dot LLP
        </div>
        <div className="audience-grid">
          {audience.map(({ icon: Icon, title, text }) => (
            <article className="audience-card" key={title}>
              <Icon size={24} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact" id="contact">
        <div>
          <p className="eyebrow">White Dot LLP | Authorized Marketing and Sales</p>
          <h2>Start a formal LIMEX material inquiry with White Dot LLP.</h2>
          <p>
            Share your application, size, thickness, current material, annual quantity, target unit
            price, and procurement objective. Our team will coordinate the next stage of LIMEX
            material consultation, sampling, and commercial discussion through the authorized supply
            chain.
          </p>
        </div>
        <div className="contact-card">
          <a className="button primary wide" href={whatsappHref} target="_blank" rel="noreferrer">
            <MessageCircle size={21} />
            WhatsApp White Dot LLP
          </a>
          <dl>
            <div>
              <dt>Company</dt>
              <dd>White Dot LLP</dd>
            </div>
            <div>
              <dt>Nature of business</dt>
              <dd>Authorized Marketing and Sales of LIMEX Material</dd>
            </div>
            <div>
              <dt>Authorized by</dt>
              <dd>TBM Co., Ltd., Japan via Seven Dot Company</dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>+91 88497 28938</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>office@whitedotindia.in</dd>
            </div>
            <div>
              <dt>Region</dt>
              <dd>Gujarat, Rajasthan, Diu, Daman, Goa</dd>
            </div>
          </dl>
        </div>
      </section>

      <footer>
        <span>White Dot LLP</span>
        <span>Authorized access to LIMEX material. Clear guidance for practical adoption.</span>
      </footer>
    </main>
  );
}

export default App;
