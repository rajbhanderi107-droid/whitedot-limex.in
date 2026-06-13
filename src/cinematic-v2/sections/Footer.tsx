import './Footer.css';
import { Instagram, Facebook, Linkedin, Twitter, Mail } from 'lucide-react';

const NAV = [
  { label: 'Material', href: '#material' },
  { label: 'Process', href: '#material' },
  { label: 'Applications', href: '#applications' },
  { label: 'Consultation', href: '#inquiry' },
] as const;

// Placeholder handles — update each href once the live profiles exist.
const SOCIAL = [
  { label: 'Instagram', href: 'https://instagram.com/whitedotindia', Icon: Instagram },
  { label: 'Facebook', href: 'https://facebook.com/whitedotindia', Icon: Facebook },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/whitedotindia', Icon: Linkedin },
  { label: 'X (Twitter)', href: 'https://x.com/whitedotindia', Icon: Twitter },
  { label: 'Email office@whitedotindia.in', href: 'mailto:office@whitedotindia.in', Icon: Mail },
] as const;

export default function Footer() {
  return (
    <footer className="v2ft">
      <div className="v2ft-inner">
        <div className="v2ft-brand">
          <p className="v2ft-wordmark">White Dot</p>
          <p className="v2ft-sub">
            Authorized LIMEX marketing &amp; sales — the sustainable way to
            replace plastic.
          </p>
          <ul className="v2ft-social" aria-label="White Dot on social media">
            {SOCIAL.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  className="v2ft-social-link"
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  title={label}
                >
                  <Icon size={18} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
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
            White Dot — marketing &amp; sales
          </p>
          <p>
            LIMEX is a material developed by TBM Co., Ltd. (Japan).
            Ads are created by the use of artificial intelligence.
          </p>
          <p className="v2ft-copy">
            © {new Date().getFullYear()} White Dot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
