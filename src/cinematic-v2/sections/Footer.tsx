import './Footer.css';

const NAV = [
  { label: 'Origin', href: '#origin' },
  { label: 'The Material', href: '#material' },
  { label: 'Comparison', href: '#comparison' },
  { label: 'Applications', href: '#applications' },
  { label: 'Sustainability', href: '#proof' },
  { label: 'Get in Touch', href: '#consultation' },
] as const;

export default function Footer() {
  return (
    <footer className="v2ft">
      <div className="v2ft-inner">
        <div className="v2ft-brand">
          <div className="v2ft-dot" aria-hidden="true" />
          <p className="v2ft-wordmark">WhiteDot</p>
          <p className="v2ft-sub">
            Authorized Marketing Partner — LIMEX<br />
            Western India Territory
          </p>
        </div>

        <nav className="v2ft-nav" aria-label="Footer navigation">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="v2ft-nav-link">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="v2ft-legal">
          <p>
            LIMEX is a registered trademark of TBM Co., Ltd. (Japan).
            WhiteDot LLP is authorized to market LIMEX in Gujarat,
            Rajasthan, Daman, Diu, and Silvassa.
          </p>
          <p className="v2ft-copy">
            © {new Date().getFullYear()} WhiteDot LLP. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
