import { getPhoneHref, getWhatsappHref, useSiteSettings } from "./siteSettings";

const explore = [
  { label: "Material", href: "#material" },
  { label: "Process", href: "#material-core" },
  { label: "Applications", href: "#applications" },
  { label: "Consultation", href: "#consult" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  const settings = useSiteSettings();
  const whatsappHref = getWhatsappHref(
    settings,
    "Hello White Dot LLP, I'd like to explore LIMEX material for my business.",
  );

  return (
    <footer className="cine-footer" id="footer">
      <div className="cine-footer-inner">
        <div className="cine-footer-brand">
          <a className="cine-brand" href="#top" aria-label="White Dot LLP — back to top">
            <img
              className="cine-brand-logo"
              src={`${import.meta.env.BASE_URL}assets/whitedot-logo-enhanced.svg`}
              alt=""
              width={30}
              height={30}
              aria-hidden="true"
            />
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
          <a href={getPhoneHref(settings)}>{settings.company_phone}</a>
          <a href={`mailto:${settings.company_email}`}>{settings.company_email}</a>
        </div>

        <div className="cine-footer-col">
          <h3>Supply chain</h3>
          <span className="cine-footer-note">TBM Co., Ltd. — Japan · inventor &amp; manufacturer</span>
          <span className="cine-footer-note">Seven Dot — authorized distributor</span>
          <span className="cine-footer-note">White Dot LLP — marketing &amp; sales</span>
        </div>
      </div>

      <div className="cine-footer-base">
        <div className="cine-footer-base-left">
          <span>© {year} White Dot LLP. All rights reserved.</span>
          <span className="cine-footer-disclaimer">
            Ads are created by the use of artificial intelligence.
          </span>
        </div>
        <span>LIMEX is a material developed by TBM Co., Ltd. (Japan).</span>
      </div>
    </footer>
  );
}
