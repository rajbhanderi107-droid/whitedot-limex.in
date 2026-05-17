import {
  ArrowRight,
  Building2,
  BookOpen,
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
import HeroScene from "./HeroScene";

const whatsappNumber = "918849728938";
const whatsappMessage =
  "Hello WhiteDot, I want to discuss LIMEX / CR LIMEX material samples and pricing for my business.";
const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path}`.replace(/\/{2,}/g, "/");

const applications = [
  "Garbage bags",
  "Shopping and grocery bags",
  "Nonwoven fabric",
  "Backlit signage film",
  "POP, menus, and sheets",
  "Sealant packaging film",
  "Purging compound",
  "Industrial molded goods",
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
    title: "Material composition",
    text: "TBM describes LIMEX as an inorganic-organic composite material made mainly from inorganic substances such as calcium carbonate, with thermoplastic resins such as PP or PE mixed and kneaded into the formulation. The key baseline is over 50% inorganic content by weight.",
  },
  {
    title: "Plastic reduction logic",
    text: "Because more of the product can be built around mineral content instead of petroleum-derived resin, suitable LIMEX products can reduce petroleum-based plastic use while keeping strength, processing, weight, and cost targets in focus.",
  },
  {
    title: "Factory entry routes",
    text: "LIMEX appears across pellets, sheets, purging materials, films, bags, and other product formats. For manufacturers, the starting point is the existing resin, machine, thickness, grade, annual volume, and application requirement.",
  },
  {
    title: "Sheet and print use",
    text: "TBM positions LIMEX Sheet as a paper and plastic alternative for posters, POP, menus, maps, packaging, clear files, mask cases, signage film, and other sheet uses, with water resistance and low water use during production.",
  },
  {
    title: "Circularity pathway",
    text: "TBM's material circulation work focuses on collecting, sorting, mechanically recycling, and regenerating used plastics and LIMEX products, so the future conversation is not only substitution but recovery and reuse.",
  },
  {
    title: "Future development",
    text: "TBM also discusses Bio LIMEX, CR LIMEX made with carbon-recycled calcium carbonate, and CirculeX recycled materials. This makes LIMEX part of a wider path: plastic reduction, carbon utilization, and circular material use.",
  },
];

const educationSteps = [
  "Current product study: size, thickness, resin, grade, price, use case, and yearly quantity.",
  "Material fit: identify whether sheet, pellet, bag, nonwoven, film, purging, or molded-goods use cases are realistic.",
  "Sample and trial: run controlled samples before making public claims or large production commitments.",
  "Impact estimate: compare plastic, water, and GHG reduction potential using product-specific assumptions.",
  "Adoption plan: prepare procurement, production, labeling, communication, and circularity steps.",
];

const tbmChannels = [
  {
    title: "CCU / Carbon Recycling",
    text: "TBM positions CCU as the work of transforming CO2 into valuable materials and supporting carbon-neutral infrastructure.",
    india:
      "For India, this helps explain why CR LIMEX is more than a replacement material: it points toward using captured carbon as an input for future manufacturing.",
    points: ["CO2 capture and utilization", "CR LIMEX direction", "Long-term decarbonization story"],
  },
  {
    title: "Material Development",
    text: "TBM develops materials from limestone, CO2-derived calcium carbonate, and recycled resources using proprietary material technology.",
    india:
      "This is the technical heart of the WhiteDot education pitch: manufacturers should understand the grade, formulation, performance, and product fit before adoption.",
    points: ["LIMEX from limestone", "CR LIMEX from carbon-recycled calcium carbonate", "CirculeX recycled material"],
  },
  {
    title: "Product Sales",
    text: "TBM sells useful final products such as purging materials, bags, sheet products, and other business-ready formats through factories and partners.",
    india:
      "For Gujarat, Rajasthan, Diu, Daman, and Goa, this means practical entry products: bags, nonwoven fabric, signage film, POP sheets, packaging film, and factory purging applications.",
    points: ["Samples for sales visits", "Cost and performance comparison", "Market-ready product education"],
  },
  {
    title: "Material Circulation",
    text: "TBM frames material circulation around collecting, sorting, mechanically recycling, and regenerating used plastics into higher-value resources.",
    india:
      "This is relevant for Indian policy and industrial clusters because plastic reduction should move beyond one-time substitution toward collection, sorting, and reuse systems.",
    points: ["Collection and sorting", "Mechanical recycling", "Circular economy infrastructure"],
  },
  {
    title: "New Business",
    text: "TBM lists AI promotion and decarbonization management support as new-business areas that help companies operate more efficiently and manage CO2 reduction.",
    india:
      "For government and large buyers, this connects materials to measurable transition work: emissions visibility, reduction plans, and operational education.",
    points: ["AI-enabled efficiency", "GHG accounting support", "Decarbonization planning"],
  },
];

const sourceLinks = [
  { label: "TBM business areas", href: "https://tb-m.com/eng/business/" },
  { label: "LIMEX composition FAQ", href: "https://tb-m.com/faq/faq-271/" },
  { label: "LIMEX product definition FAQ", href: "https://tb-m.com/faq/faq-345/" },
  { label: "LIMEX Sheet details", href: "https://tb-m.com/eng/business/material/products-sheet/" },
  { label: "LIMEX label guideline", href: "https://tb-m.com/doc/guidelines_limexlabel_en.pdf" },
];

function App() {
  return (
    <main>
      <HeroScene />
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="brand" href="#home" aria-label="WhiteDot home">
          <img className="brand-symbol" src={assetPath("assets/whitedot-symbol.svg")} alt="" />
          <span className="brand-wordmark">
            <span className="brand-name">WhiteDot</span>
            <small>India</small>
          </span>
        </a>
        <div className="nav-links">
          <a href="#material">Material</a>
          <a href="#education">Education</a>
          <a href="#impact-data">Impact</a>
          <a href="#applications">Applications</a>
          <a href="#tbm-channels">TBM model</a>
          <a href="#traction">Traction</a>
          <a href="#contact">Contact</a>
        </div>
        <a className="nav-action" href={whatsappHref} target="_blank" rel="noreferrer">
          <MessageCircle size={18} />
          WhatsApp
        </a>
      </nav>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">Regional LIMEX distribution and industrial education</p>
          <h1>Stone-based materials for the next phase of Indian manufacturing.</h1>
          <p className="hero-text">
            WhiteDot introduces LIMEX and CR LIMEX solutions across Gujarat, Rajasthan, Diu, Daman,
            and Goa for factories, processors, institutions, and market channels ready to reduce
            petroleum-based plastic dependence.
          </p>
          <div className="hero-actions">
            <a className="button primary" href={whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle size={20} />
              Start a LIMEX inquiry
            </a>
            <a className="button secondary" href="#applications">
              Explore applications
              <ArrowRight size={19} />
            </a>
          </div>
        </div>
        <div className="territory-panel" aria-label="WhiteDot dealership territory">
          <div className="territory-head">
            <MapPin size={22} />
            <div>
              <strong>Authorized regional dealership</strong>
              <span>Western India coastal and industrial belt</span>
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

      <section className="section material" id="material">
        <div className="section-kicker">
          <Leaf size={18} />
          Material intelligence
        </div>
        <div className="section-grid">
          <div>
            <h2>LIMEX is built around limestone, not old assumptions.</h2>
          </div>
          <div className="section-copy">
            <p>
              LIMEX is described by TBM as an inorganic-organic composite material containing over
              50% inorganic substances such as calcium carbonate. It is developed as an alternative
              material for plastic and paper applications, with product-specific environmental
              effects calculated by life cycle assessment.
            </p>
            <p>
              For Indian customers, the message is practical: compare current product specs, trial
              samples, check molding or converting needs, and then quantify plastic, water, and GHG
              reduction potential for the selected product.
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

      <section className="section education" id="education">
        <div className="section-kicker">
          <BookOpen size={18} />
          Education for adoption
        </div>
        <div className="split-heading">
          <h2>Manufacturers and government buyers need a clear material roadmap, not only a product sample.</h2>
          <p>
            WhiteDot can use LIMEX education to connect factory trials, procurement discussions,
            plastic-reduction policy, and future circularity work into one understandable story for India.
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
            <h3>WhiteDot adoption conversation</h3>
            <p>
              Every serious buyer should move through a structured discussion before claiming
              environmental impact or changing production.
            </p>
          </div>
          <ol>
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
          WhiteDot should collect each buyer's resin, thickness, gsm, machine, annual quantity, and target price,
          then present trial-specific impact estimates before making public environmental claims.
        </p>
      </section>

      <section className="section tbm-tree" id="tbm-channels">
        <div className="section-kicker">
          <Split size={18} />
          TBM global reference model
        </div>
        <div className="split-heading">
          <h2>TBM connects five business channels into one sustainability system.</h2>
          <p>
            Based on TBM Tokyo's official business introduction, WhiteDot uses this structure as a
            reference lens for explaining how LIMEX, CR LIMEX, product adoption, circularity, and
            decarbonization planning fit into larger industrial change.
          </p>
        </div>
        <div className="channel-tree" aria-label="TBM five business channels">
          <div className="tree-core">
            <span>TBM</span>
            <strong>5 business areas</strong>
          </div>
          {tbmChannels.map((channel, index) => (
            <article className={`channel-node node-${index + 1}`} key={channel.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{channel.title}</h3>
              <p>{channel.text}</p>
              <strong>India relevance</strong>
              <p>{channel.india}</p>
              <ul>
                {channel.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
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
          <h2>From shop bags to industrial lines, the pitch starts with the product you already make.</h2>
          <p>
            WhiteDot can organize focused sample discussions for high-volume manufacturing,
            government procurement, local shop demand, and brand-facing sustainable packaging.
          </p>
        </div>
        <div className="application-grid">
          {applications.map((item) => (
            <article className="application-card" key={item}>
              <span />
              <h3>{item}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="section traction" id="traction">
        <div className="section-kicker">
          <ShieldCheck size={18} />
          Regional traction
        </div>
        <div className="traction-layout">
          <div>
            <h2>Samples, approvals, and market education for western India.</h2>
            <p>
              WhiteDot is building LIMEX awareness with factory owners, manufacturing-bag
              companies, city markets, village shops, and major infrastructure conversations.
              Mentioned names are handled as sample and approval references unless written
              permission is available for public endorsement.
            </p>
          </div>
          <div className="traction-list">
            <div>
              <strong>Sample programs</strong>
              <span>Havmor Plast, Amul, Astral Pipes, and manufacturing-bag discussions.</span>
            </div>
            <div>
              <strong>Market orders</strong>
              <span>Small shops in village and city markets for practical daily-use products.</span>
            </div>
            <div>
              <strong>Education focus</strong>
              <span>Material comparisons, sample quality, product fit, and environmental reporting.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section why" id="why-whitedot">
        <div className="section-kicker">
          <Recycle size={18} />
          Why WhiteDot
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
          <p className="eyebrow">Start with one sample conversation</p>
          <h2>Bring your current product specs. WhiteDot will help map the LIMEX route.</h2>
          <p>
            Share size, thickness, material, annual quantity, target unit price, and use case. The
            next step is a practical sample and quotation discussion.
          </p>
        </div>
        <div className="contact-card">
          <a className="button primary wide" href={whatsappHref} target="_blank" rel="noreferrer">
            <MessageCircle size={21} />
            WhatsApp WhiteDot
          </a>
          <dl>
            <div>
              <dt>WhatsApp</dt>
              <dd>+91 88497 28938</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>rajbhanderi107@gmail.com</dd>
            </div>
            <div>
              <dt>Region</dt>
              <dd>Gujarat, Rajasthan, Diu, Daman, Goa</dd>
            </div>
          </dl>
        </div>
      </section>

      <footer>
        <span>WhiteDot India</span>
        <span>
          LIMEX information should be finalized against approved TBM material, brand, and label
          guidelines before public launch.
        </span>
      </footer>
    </main>
  );
}

export default App;
