const whatsappHref =
  "https://wa.me/918849728938?text=" +
  encodeURIComponent("Hello White Dot LLP, I'd like to explore LIMEX material for my business.");

const explore = [
  { label: "Material", href: "#material" },
  { label: "Process", href: "#material-core" },
  { label: "Applications", href: "#applications" },
  { label: "Consultation", href: "#consult" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="cine-footer" id="footer">
      <div className="cine-footer-inner">
        <div className="cine-footer-brand">
          <a className="cine-brand" href="#top" aria-label="White Dot LLP — back to top">
            <span className="dot" aria-hidden="true" />
            <span>
              White Dot <small>LLP</small>
            </span>
          </a>
          <p>Authorized LIMEX marketing &amp; sales — the sustainable way to replace plastic.</p>
        </div>

        <nav className="cine-footer-col" aria-label="Explore">
          <h3>Explore</h3>
          {explore.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="cine-footer-col">
          <h3>Contact</h3>
          <a href={whatsappHref} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a href="tel:+918849728938">+91 88497 28938</a>
        </div>

        <div className="cine-footer-col">
          <h3>Supply chain</h3>
          <span className="cine-footer-note">TBM Co., Ltd. — Japan · inventor &amp; manufacturer</span>
          <span className="cine-footer-note">Seven Dot — authorized distributor</span>
          <span className="cine-footer-note">White Dot LLP — marketing &amp; sales</span>
        </div>
      </div>

      <div className="cine-footer-base">
        <span>© {year} White Dot LLP. All rights reserved.</span>
        <span>LIMEX is a material developed by TBM Co., Ltd. (Japan).</span>
      </div>
    </footer>
  );
}
