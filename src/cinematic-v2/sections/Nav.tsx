import { useState, useEffect, useRef } from 'react';
import './Nav.css';

const LINKS = [
  { label: 'Material', href: '#material' },
  { label: 'LIMEX', href: '#limex' },
  { label: 'Compare', href: '#comparison' },
  { label: 'Applications', href: '#applications' },
  { label: 'Consultation', href: '#consultation' },
] as const;

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);

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

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => setOpen(false);

  const cls = ['v2nav', scrolled && 'v2nav--scrolled', hidden && 'v2nav--hidden']
    .filter(Boolean).join(' ');

  return (
    <header className={cls} role="banner">
      <div className="v2nav-inner">
        <a href="#" className="v2nav-brand" aria-label="WhiteDot — home">
          <span className="v2nav-dot" aria-hidden="true" />
          <span className="v2nav-wordmark">WhiteDot</span>
        </a>

        <nav className="v2nav-links" aria-label="Primary navigation">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="v2nav-link">
              {l.label}
            </a>
          ))}
        </nav>

        <a href="#consultation" className="v2nav-cta">Get in Touch</a>

        <button
          className="v2nav-burger"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`v2nav-burger-line${open ? ' v2nav-burger-line--top-open' : ''}`} />
          <span className={`v2nav-burger-line${open ? ' v2nav-burger-line--bot-open' : ''}`} />
        </button>
      </div>

      <div
        className={`v2nav-drawer${open ? ' v2nav-drawer--open' : ''}`}
        aria-hidden={!open}
        inert={open ? undefined : true}
      >
        <nav aria-label="Mobile navigation">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="v2nav-drawer-link" onClick={close}>
              {l.label}
            </a>
          ))}
          <a href="#consultation" className="v2nav-drawer-link" onClick={close}>
            Get in Touch
          </a>
        </nav>
      </div>
    </header>
  );
}
