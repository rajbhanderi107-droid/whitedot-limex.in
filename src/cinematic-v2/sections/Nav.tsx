import { useState, useEffect, useRef } from 'react';
import { CONSULTATION_HASH, GMAIL_CONTACT_HREF, openConsultationForm } from '../consultationNavigation';
import { useBrandLogo } from '../../useBrandLogo';
import './Nav.css';

const LINKS = [
  { label: 'Material', href: '#material' },
  { label: 'LIMEX', href: '#limex' },
  { label: 'Compare', href: '#comparison' },
  { label: 'Applications', href: '#applications' },
  { label: 'Case Studies', href: '#/case-studies' },
  { label: 'News', href: '#/news' },
  { label: 'Consultation', href: CONSULTATION_HASH },
] as const;

export default function Nav() {
  const brandLogo = useBrandLogo();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setScrolled(y > 60);
      setHidden(y > lastY.current && y > 140);
      lastY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy: highlight nav link of section in view.
  useEffect(() => {
    const sections = LINKS
      .map((l) => document.getElementById(l.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(`#${entry.target.id}`);
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const adminBasePath = window.location.hostname.endsWith('github.io') ? '/whitedot-limex.in' : '';
  const adminLoginHref = `${adminBasePath}/#/admin/login`;
  const forceAdminLogin = () => {
    window.localStorage.removeItem('wd_admin_token');
  };

  const cls = ['v2nav', scrolled && 'v2nav--scrolled', hidden && 'v2nav--hidden']
    .filter(Boolean).join(' ');

  return (
    <header className={cls} role="banner">
      <div className="v2nav-inner">
        {/* Secret admin entry — looks like a normal brand logo, opens admin login on click. No visual cue. */}
        <a
          href={adminLoginHref}
          className="v2nav-brand"
          aria-label="WhiteDot — home"
          target="_blank"
          rel="noreferrer"
          onClick={() => { forceAdminLogin(); closeMenu(); }}
        >
          <img className="v2nav-logo" src={brandLogo} alt="WhiteDot logo" width={30} height={30} decoding="async" />
          <span className="v2nav-brand-text">
            <span className="v2nav-wordmark">WhiteDot</span>
            <span className="v2nav-tagline">by Seven Dot</span>
          </span>
        </a>

        <nav className="v2nav-links" aria-label="Primary navigation">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`v2nav-link${activeId === l.href ? ' is-active' : ''}`}
              aria-current={activeId === l.href ? 'true' : undefined}
              onClick={(event) => {
                if (l.href === CONSULTATION_HASH) {
                  event.preventDefault();
                  openConsultationForm('inquiry');
                }
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a href={GMAIL_CONTACT_HREF} className="v2nav-cta" target="_blank" rel="noreferrer">Get in Touch</a>

        {/* Hamburger button — mobile only */}
        <button
          className={`v2nav-hamburger${menuOpen ? ' v2nav-hamburger--open' : ''}`}
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="v2nav-hamburger-bars" aria-hidden="true">
            <span className="v2nav-hamburger-line v2nav-hamburger-line--top" />
            <span className="v2nav-hamburger-line v2nav-hamburger-line--mid" />
            <span className="v2nav-hamburger-line v2nav-hamburger-line--bot" />
          </span>
        </button>

      </div>

      {/* Mobile backdrop overlay */}
      <div
        className={`v2nav-mobile-overlay${menuOpen ? ' is-open' : ''}`}
        aria-hidden="true"
        onClick={closeMenu}
      />

      {/* Mobile nav drawer */}
      <nav
        className={`v2nav-mobile-drawer${menuOpen ? ' is-open' : ''}`}
        aria-label="Mobile navigation"
      >
        <div className="v2nav-mobile-links">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`v2nav-mobile-link${activeId === l.href ? ' is-active' : ''}`}
              onClick={(event) => {
                closeMenu();
                if (l.href === CONSULTATION_HASH) {
                  event.preventDefault();
                  openConsultationForm('inquiry');
                }
              }}
            >
              {l.label}
            </a>
          ))}
          <a
            className="v2nav-mobile-cta"
            href={GMAIL_CONTACT_HREF}
            target="_blank"
            rel="noreferrer"
            onClick={closeMenu}
          >
            Get in Touch
          </a>
        </div>
      </nav>
    </header>
  );
}
