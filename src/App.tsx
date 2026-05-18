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
    role: "Sole Authorized Distributor in India",
    text: "Authorized directly by TBM Co., Ltd., Japan to distribute LIMEX material for the Indian market.",
    action: "Exclusive Supply Agreement",
  },
  {
    title: "White Dot LLP",
    role: "Authorized Marketing and Sales Firm",
    text: "Exclusively formed to market, distribute, and sell LIMEX raw material across designated Indian states.",
    action: "Sells to",
  },
  {
    title: "Industries and Businesses",
    role: "Authorized-State End Clients",
    text: "Industrial buyers, processors, institutions, and businesses seeking certified LIMEX supply.",
    action: "",
  },
];

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
    text: "LIMEX is an innovative and eco-friendly raw material developed by TBM Co., Ltd., Japan. It is primarily composed of limestone and is designed for paper-like and plastic-like applications depending on the selected product format.",
  },
  {
    title: "Application potential",
    text: "LIMEX can support packaging, printing, sheet, film, nonwoven, and selected industrial applications where material performance, sustainability, and supply reliability must be evaluated together.",
  },
  {
    title: "Exclusive Indian marketing",
    text: "In India, LIMEX material is represented through Seven Dot Company's certified distributing and marketing supply chain, established under its distributor dealership from TBM Tokyo, Japan, and executed commercially by White Dot LLP for designated states.",
  },
  {
    title: "Product qualification",
    text: "Every industrial discussion should begin with the buyer's application, thickness, resin system, machinery, annual volume, quality requirements, and target commercial structure.",
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
      "This is the technical heart of the White Dot LLP education pitch: manufacturers should understand the grade, formulation, performance, and product fit before adoption.",
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
        <a className="brand" href="#home" aria-label="White Dot LLP home">
          <img className="brand-symbol" src={assetPath("assets/whitedot-symbol.svg")} alt="" />
          <span className="brand-wordmark">
            <span className="brand-name">White Dot</span>
            <small>LLP</small>
          </span>
        </a>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#authorization">Authorization</a>
          <a href="#material">Material</a>
          <a href="#education">Education</a>
          <a href="#impact-data">Impact</a>
          <a href="#applications">Applications</a>
          <a href="#contact">Contact</a>
        </div>
        <a className="nav-action" href={whatsappHref} target="_blank" rel="noreferrer">
          <MessageCircle size={18} />
          WhatsApp
        </a>
      </nav>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">Exclusively Authorized. Sustainably Supplied.</p>
          <h1>India's authorized gateway to LIMEX by TBM Japan.</h1>
          <p className="hero-text">
            White Dot LLP is the authorized marketing and sales firm for LIMEX raw material across
            designated Indian states, operating through Seven Dot Company's certified distributing
            and marketing supply chain, established under its distributor dealership from TBM Tokyo,
            Japan.
          </p>
          <div className="hero-actions">
            <a className="button primary" href={whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle size={20} />
              Start a LIMEX inquiry
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
              <span>Pan-India-ready marketing structure with current regional focus</span>
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

      <section className="section about" id="about">
        <div className="section-kicker">
          <Building2 size={18} />
          About White Dot LLP
        </div>
        <div className="section-grid">
          <div>
            <h2>Established as the dedicated commercial platform for LIMEX in India.</h2>
          </div>
          <div className="section-copy">
            <p>
              White Dot LLP has been established as a specialized marketing, distribution, and sales
              firm for LIMEX raw material across authorized states in India. The company does not
              manufacture LIMEX. Its role is to represent the material commercially, educate
              industries, coordinate qualified supply discussions, and support client adoption through
              Seven Dot Company's certified distributing and marketing supply chain.
            </p>
            <p>
              The authorization structure begins with TBM Co., Ltd., Japan, the original manufacturer
              and global licensor of LIMEX material. TBM Japan has granted the exclusive distributor
              dealership for the Indian market to Seven Dot Company. Seven Dot Company is exclusively
              authorized to supply LIMEX material only to White Dot LLP, and to no other entity or firm.
            </p>
            <p>
              Through this chain of authorization, White Dot LLP serves as the sole firm authorized to
              market and sell LIMEX material to end clients, industries, and businesses across
              designated Indian states. White Dot LLP is committed to delivering premium raw material
              solutions, transparent technical communication, and dependable commercial coordination
              for businesses evaluating sustainable material alternatives.
            </p>
            <p>
              Industries, processors, institutions, and business buyers are invited to partner with
              White Dot LLP for professional LIMEX material consultation, sampling, and supply
              coordination.
            </p>
          </div>
        </div>
        <div className="credential-grid">
          <article className="credential-card">
            <ShieldCheck size={23} />
            <h3>Exclusively authorized</h3>
            <p>
              White Dot LLP operates through Seven Dot Company's certified distributing and marketing
              supply chain, backed by distributor dealership from TBM Tokyo, Japan.
            </p>
          </article>
          <article className="credential-card">
            <Globe2 size={23} />
            <h3>Strategic marketing partner</h3>
            <p>The firm is focused on B2B market development, technical education, and client conversion.</p>
          </article>
          <article className="credential-card">
            <Factory size={23} />
            <h3>Industrial supply focus</h3>
            <p>All discussions are structured around material fit, commercial viability, and authorized supply.</p>
          </article>
        </div>
      </section>

      <section className="section authorization" id="authorization">
        <div className="section-kicker">
          <ShieldCheck size={18} />
          Certification and authorization
        </div>
        <div className="split-heading">
          <h2>A certified Seven Dot Company distribution and marketing chain for Indian industries.</h2>
          <p>
            White Dot LLP's market position is defined by a formal authorization chain: TBM Tokyo,
            Japan has granted distributor dealership to Seven Dot Company, and Seven Dot Company
            maintains the certified distributing and marketing supply chain through which LIMEX is
            supplied exclusively to White Dot LLP for authorized marketing and sales.
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
            <h2>A globally recognized sustainable raw material developed by TBM Japan.</h2>
          </div>
          <div className="section-copy">
            <p>
              LIMEX is an innovative, eco-friendly raw material developed by TBM Co., Ltd., Japan.
              It is primarily composed of limestone and is recognized globally as a sustainable
              material platform for paper-like and plastic-like applications.
            </p>
            <p>
              LIMEX is suitable for packaging, printing, sheet, film, nonwoven, and selected
              industrial use cases where performance, quality, and sustainability must work together.
              In India, LIMEX is marketed and supplied exclusively through White Dot LLP under the
              Seven Dot Company's certified distributing and marketing supply chain, established
              under distributor dealership from TBM Tokyo, Japan.
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
          Client education for adoption
        </div>
        <div className="split-heading">
          <h2>Manufacturers and government buyers need a clear material roadmap, not only a product sample.</h2>
          <p>
            White Dot LLP uses LIMEX education to connect factory trials, procurement discussions,
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
            <h3>White Dot LLP adoption conversation</h3>
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
          White Dot LLP should collect each buyer's resin, thickness, gsm, machine, annual quantity, and target price,
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
            Based on TBM Tokyo's official business introduction, White Dot LLP uses this structure as a
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
            White Dot LLP can organize focused sample discussions for high-volume manufacturing,
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
              White Dot LLP is building LIMEX awareness with factory owners, manufacturing-bag
              companies, city markets, village shops, and major infrastructure conversations.
              Mentioned names are handled as sample and approval references unless written
              permission is available for public endorsement.
            </p>
          </div>
          <div className="traction-list">
            <div>
              <strong>Sample programs</strong>
              <span>Confidential sample discussions with packaging, processing, and industrial product buyers.</span>
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
            price, and procurement objective. White Dot LLP will coordinate the next stage of LIMEX
            material consultation, sampling, and commercial discussion through Seven Dot Company's
            certified distributing and marketing supply chain.
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
        <span>White Dot LLP</span>
        <span>
          India's Authorized Gateway to LIMEX by TBM Japan. Exclusively Authorized. Sustainably Supplied.
        </span>
      </footer>
    </main>
  );
}

export default App;
