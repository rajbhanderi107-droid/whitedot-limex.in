import './Footer.css';

const NAV = [
  { label: 'Material', href: '#material' },
  { label: 'Process', href: '#material' },
  { label: 'Applications', href: '#applications' },
  { label: 'Consultation', href: '#consultation' },
] as const;

export default function Footer() {
  return (
    <footer className="v2ft">
      <div className="v2ft-inner">
        <div className="v2ft-brand">
          <div className="v2ft-dot" aria-hidden="true" />
          <p className="v2ft-wordmark">White Dot <small>LLP</small></p>
          <p className="v2ft-sub">
            Authorized LIMEX marketing &amp; sales — the sustainable way to
            replace plastic.
          </p>
        </div>

        <nav className="v2ft-nav" aria-label="Footer navigation">
          {NAV.map((n) => (
            <a key={`${n.label}-${n.href}`} href={n.href} className="v2ft-nav-link">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="v2ft-legal">
          <p className="v2ft-supply">
            TBM Co., Ltd. — Japan · inventor &amp; manufacturer<br />
            Seven Dot — authorized distributor<br />
            White Dot LLP — marketing &amp; sales
          </p>
          <p>
            LIMEX is a material developed by TBM Co., Ltd. (Japan).
            Ads are created by the use of artificial intelligence.
          </p>
          <p className="v2ft-copy">
            © {new Date().getFullYear()} White Dot LLP. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
