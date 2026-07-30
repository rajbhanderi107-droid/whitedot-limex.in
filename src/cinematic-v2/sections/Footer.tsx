import './Footer.css';
import { Instagram, Facebook, Linkedin, Twitter, Mail } from 'lucide-react';

const BASE = import.meta.env.BASE_URL;
// Cache-busted: this filename is served with a 1-year immutable
// Cache-Control by Cloudflare, so replacing the file in place doesn't reach
// visitors until the query string changes (same fix as the Material
// Journey backdrop — see PelletGalaxy.tsx).
const FOOTER_VIDEO = `${BASE}assets/videos/section-bg/footer-limestone-flow.mp4?v=20260720-rocks-to-line`;
const FOOTER_VIDEO_POSTER = `${BASE}assets/images/footer-limex-background-poster.jpg`;
const FOOTER_STATIC = `${BASE}assets/images/footer-limex-background.png`;

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
  // Muted, looping background video — decorative only, same policy as the
  // Material Journey canvas (see PelletGalaxy.tsx): shown to all visitors by
  // default, falling back to the static image only for explicit data-saver
  // connections where loading video would be wasteful.
  const saveData =
    typeof navigator !== 'undefined' &&
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

  return (
    <footer className="v2ft">
      {!saveData ? (
        <video
          className="v2ft-bg"
          src={FOOTER_VIDEO}
          poster={FOOTER_VIDEO_POSTER}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ) : (
        <img className="v2ft-bg" src={FOOTER_STATIC} alt="" aria-hidden="true" loading="lazy" />
      )}
      <div className="v2ft-inner">
        <div className="v2ft-brand">
          <p className="v2ft-wordmark">White Dot</p>
          <p className="v2ft-tagline">by Seven Dot</p>
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
            TBM Co., Ltd. — inventor &amp; manufacturer<br />
            Seven Dot — authorized distributor<br />
            White Dot — marketing &amp; sales
          </p>
          <p>
            LIMEX is a material developed by TBM Co., Ltd.
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
