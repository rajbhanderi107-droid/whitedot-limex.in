import { useState, useEffect, useRef } from 'react';
import './Nav.css';

const LINKS = [
  { label: 'Material', href: '#material' },
  { label: 'LIMEX', href: '#limex' },
  { label: 'Compare', href: '#comparison' },
  { label: 'Applications', href: '#applications' },
  { label: 'News', href: '#news' },
  { label: 'Consultation', href: '#consultation' },
] as const;

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const adminMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!adminOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!adminMenuRef.current?.contains(event.target as Node)) {
        setAdminOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAdminOpen(false);
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [adminOpen]);

  const adminBasePath = window.location.hostname.endsWith('github.io') ? '/whitedot-limex.in' : '';
  const adminLoginHref = `${adminBasePath}/#/admin/login`;
  const forceAdminLogin = () => {
    window.localStorage.removeItem('wd_admin_token');
    setAdminOpen(false);
  };

  const cls = ['v2nav', scrolled && 'v2nav--scrolled', hidden && 'v2nav--hidden']
    .filter(Boolean).join(' ');

  return (
    <header className={cls} role="banner">
      <div className="v2nav-inner">
        <a href="#" className="v2nav-brand" aria-label="WhiteDot — home" onClick={closeMenu}>
          <span className="v2nav-wordmark">WhiteDot</span>
        </a>

        <nav className="v2nav-links" aria-label="Primary navigation">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`v2nav-link${activeId === l.href ? ' is-active' : ''}`}
              aria-current={activeId === l.href ? 'true' : undefined}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a href="#consultation" className="v2nav-cta">Get in Touch</a>

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

        <div className="v2nav-admin-menu" ref={adminMenuRef}>
          <button
            className={`v2nav-admin-trigger${adminOpen ? ' v2nav-admin-trigger--open' : ''}`}
            type="button"
            aria-label={adminOpen ? 'Close admin menu' : 'Open admin menu'}
            aria-expanded={adminOpen}
            aria-controls="v2nav-admin-panel"
            onClick={() => setAdminOpen((o) => !o)}
          >
            <span className="v2nav-admin-bars" aria-hidden="true">
              <span className="v2nav-admin-line v2nav-admin-line--top" />
              <span className="v2nav-admin-line v2nav-admin-line--mid" />
              <span className="v2nav-admin-line v2nav-admin-line--bot" />
            </span>
          </button>

          <div
            id="v2nav-admin-panel"
            className="v2nav-admin-panel"
            data-open={adminOpen ? 'true' : 'false'}
            aria-hidden={!adminOpen}
            style={{
              opacity: adminOpen ? 1 : 0,
              pointerEvents: adminOpen ? 'auto' : 'none',
              transform: adminOpen ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.98)',
            }}
          >
            <a
              className="v2nav-admin-panel-link"
              href={adminLoginHref}
              target="_blank"
              rel="noreferrer"
              tabIndex={adminOpen ? undefined : -1}
              onClick={forceAdminLogin}
            >
              Admin Panel
            </a>
          </div>
        </div>

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
              onClick={closeMenu}
            >
              {l.label}
            </a>
          ))}
          <a
            className="v2nav-mobile-cta"
            href="#consultation"
            onClick={closeMenu}
          >
            Get in Touch
          </a>

          <div className="v2nav-mobile-divider" aria-hidden="true" />

          <a
            className="v2nav-mobile-link v2nav-mobile-link--admin"
            href={adminLoginHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              forceAdminLogin();
              closeMenu();
            }}
          >
            Admin Panel
          </a>
        </div>
      </nav>
    </header>
  );
}
