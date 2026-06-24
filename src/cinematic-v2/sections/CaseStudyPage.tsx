import { useEffect, useRef } from 'react';
import Nav from './Nav';
import Footer from './Footer';
import './CaseStudyPage.css';

const basePath = window.location.hostname.endsWith('github.io') ? '/whitedot-limex.in' : '';
const bobbinHref  = `${basePath}/case-study/bobbin.html`;
const bobbinModel = `${basePath}/case-study/model/bobbin.glb`;
const bobbinPoster = `${basePath}/case-study/frames/bobbin_0.webp`;

export default function CaseStudyPage() {
  const cardRef    = useRef<HTMLDivElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number>(0);

  useEffect(() => {
    window.scrollTo(0, 0);

    // ── Inject model-viewer if not already present ──
    if (!customElements.get('model-viewer')) {
      const s = document.createElement('script');
      s.type = 'module';
      s.src = 'https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
      document.head.appendChild(s);
    }

    // ── Card expand animation ──
    const card = cardRef.current;
    if (card) {
      requestAnimationFrame(() => {
        card.classList.add('phase-0');
        setTimeout(() => {
          card.classList.remove('phase-0');
          card.classList.add('expanded');
        }, 1200);
      });
    }

    // ── 3D Coverflow marquee ──
    const grid    = gridRef.current;
    const section = sectionRef.current;
    if (!grid || !section) return;

    let scrollX  = 0;
    const speed  = 0.65;
    let paused   = false;

    grid.addEventListener('mouseenter', () => { paused = true; });
    grid.addEventListener('mouseleave', () => { paused = false; });

    function applyCardTransforms() {
      const sRect   = section!.getBoundingClientRect();
      const centerX = sRect.left + sRect.width / 2;
      grid!.querySelectorAll<HTMLElement>('.csp-pcard').forEach(c => {
        const r     = c.getBoundingClientRect();
        const cx    = r.left + r.width / 2;
        const off   = (cx - centerX) / (sRect.width * 0.5);
        const t     = Math.max(-1.6, Math.min(1.6, off));
        const absT  = Math.abs(t);
        const rotY  = t * 28;
        const scale = 1 - absT * 0.14;
        const tz    = -absT * 60;
        const opa   = Math.max(0.82, 1 - absT * 0.22);
        c.style.transform = `rotateY(${rotY}deg) scale(${scale}) translateZ(${tz}px)`;
        c.style.opacity   = String(opa);
        c.style.zIndex    = String(Math.round((1 - absT) * 10));
      });
    }

    function tick() {
      if (!paused) {
        scrollX += speed;
        const half = grid!.scrollWidth / 2;
        if (scrollX >= half) scrollX = 0;
        grid!.style.transform = `translate3d(${-scrollX}px,0,0)`;
      }
      applyCardTransforms();
      rafRef.current = requestAnimationFrame(tick);
    }

    const startTimer = setTimeout(() => { rafRef.current = requestAnimationFrame(tick); }, 1300);

    // ── Mouse-tracking glow ──
    document.querySelectorAll<HTMLElement>('.csp-pcard.live').forEach(c => {
      const glow = c.querySelector<HTMLElement>('.csp-pglow');
      if (!glow) return;
      c.addEventListener('mousemove', (e: MouseEvent) => {
        const r = c.getBoundingClientRect();
        glow.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        glow.style.setProperty('--gy', ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%');
      });
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(startTimer);
    };
  }, []);

  // Product cards — rendered twice for infinite scroll
  const cards = (
    <>
      {/* 01 Bobbin — live */}
      <a className="csp-pcard featured live" href={bobbinHref} data-product="bobbin">
        <div className="csp-border-beam" />
        <div className="csp-pglass" />
        <div className="csp-pglow" />
        <div className="csp-pmedia">
          <span className="csp-pidx">01</span>
          {/* @ts-ignore custom element */}
          <model-viewer
            src={bobbinModel}
            poster={bobbinPoster}
            alt="Bobbin — LIMEX textile bobbin 3D model"
            interaction-prompt="none"
            shadow-intensity="0"
            exposure="1.15"
            tone-mapping="neutral"
            environment-image="neutral"
            camera-orbit="30deg 75deg 105%"
            style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
          />
        </div>
        <div className="csp-pinfo">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span className="csp-pfeatured">Featured</span>
            </div>
            <div className="csp-pname">Bobbin</div>
            <div className="csp-ptag">Textile Bobbin · Injection Moulded</div>
            <div className="csp-pbar">
              <span style={{ flex:40, height:'100%', background:'var(--cs-green)', display:'block' }} />
              <span style={{ flex:60, height:'100%', background:'#d0d3ce', display:'block' }} />
            </div>
            <div className="csp-pbarlabels">
              <span className="csp-pdot pp" /><span className="csp-pblabel">40% LIMEX</span>
              <span className="csp-psep">·</span>
              <span className="csp-pdot lx" /><span className="csp-pblabel">60% PP</span>
            </div>
          </div>
          <span className="csp-pgo">→</span>
        </div>
      </a>

      {/* 02 — coming soon */}
      <div className="csp-pcard soon">
        <div className="csp-pmedia">
          <span className="csp-pidx">02</span>
          <span className="csp-psoon-badge">Coming soon</span>
          <span className="csp-psoon-ph">+</span>
        </div>
        <div className="csp-pinfo">
          <div>
            <div className="csp-pname csp-pname--muted">Next Product</div>
            <div className="csp-ptag">In development</div>
            <div className="csp-pavail">Available Q3 2026</div>
          </div>
          <span className="csp-pgo">→</span>
        </div>
      </div>

      {/* 03 — coming soon */}
      <div className="csp-pcard soon">
        <div className="csp-pmedia">
          <span className="csp-pidx">03</span>
          <span className="csp-psoon-badge">Coming soon</span>
          <span className="csp-psoon-ph">+</span>
        </div>
        <div className="csp-pinfo">
          <div>
            <div className="csp-pname csp-pname--muted">Next Product</div>
            <div className="csp-ptag">In development</div>
            <div className="csp-pavail">Available Q3 2026</div>
          </div>
          <span className="csp-pgo">→</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="v2-root">
      <Nav />
      <main className="csp-main">
        <div className="csp-page">
          <div className="csp-hero-card" ref={cardRef} id="cspHeroCard">
            {/* Floating blobs */}
            <div className="csp-blobs" aria-hidden="true">
              <div className="csp-blob csp-blob--orange" />
              <div className="csp-blob csp-blob--green" />
            </div>

            {/* Loader */}
            <div className="csp-loader" id="cspLoader">
              <div className="csp-loader-ring" />
            </div>

            {/* Headline */}
            <div className="csp-card-hero">
              <div className="csp-eyebrow" style={{ marginBottom: '16px' }}>
                <span className="csp-rw" style={{ '--wd':'0.4s', fontSize: '10px', fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--cs-green)', display: 'inline-block' } as React.CSSProperties}>Case</span>{' '}
                <span className="csp-rw" style={{ '--wd':'0.48s', fontSize: '10px', fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--cs-green)', display: 'inline-block' } as React.CSSProperties}>Studies</span>{' '}
                <span className="csp-rw" style={{ '--wd':'0.56s', fontSize: '10px', fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--cs-green)', display: 'inline-block' } as React.CSSProperties}>·</span>{' '}
                <span className="csp-rw" style={{ '--wd':'0.64s', fontSize: '10px', fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--cs-green)', display: 'inline-block' } as React.CSSProperties}>India</span>
              </div>
              <h1 className="csp-h1">
                <span className="csp-rw" style={{ '--wd':'0.72s' } as React.CSSProperties}>Explore</span>{' '}
                <span className="csp-rw" style={{ '--wd':'0.8s' } as React.CSSProperties}>Products</span>{' '}
                <span className="csp-rw" style={{ '--wd':'0.88s' } as React.CSSProperties}>Reimagined</span><br />
                <span className="csp-rw" style={{ '--wd':'0.96s' } as React.CSSProperties}>in </span>
                <span className="csp-rw csp-accent" style={{ '--wd':'1.04s' } as React.CSSProperties}>LIMEX</span>
              </h1>
              <p className="csp-hsub">Everyday plastic parts, rebuilt with limestone-based material. Select a product to explore it in 3D and see how its composition changes.</p>
              <div className="csp-hstats">
                <div className="csp-hs-item"><span className="csp-hs-num">01</span><span className="csp-hs-label">Active Study</span></div>
                <div className="csp-hs-div" />
                <div className="csp-hs-item"><span className="csp-hs-num">3D</span><span className="csp-hs-label">Interactive</span></div>
                <div className="csp-hs-div" />
                <div className="csp-hs-item"><span className="csp-hs-num">40<small>%</small></span><span className="csp-hs-label">LIMEX PE78-02M</span></div>
                <div className="csp-hs-div" />
                <div className="csp-hs-item"><span className="csp-hs-num csp-hs-num--green">~38<small>%</small></span><span className="csp-hs-label">CO₂e Cut (LCA)</span></div>
              </div>
            </div>

            {/* Product marquee */}
            <div className="csp-grid-section" ref={sectionRef}>
              <div className="csp-lens-wrap">
                <div className="csp-pgrid" ref={gridRef}>
                  {cards}
                  {cards}
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="csp-card-footer">
              <div className="csp-footer-left">
                <div className="csp-avatars">
                  <span className="csp-av csp-av--w">W</span>
                  <span className="csp-av csp-av--t">T</span>
                  <span className="csp-av csp-av--l">L</span>
                </div>
                <div>
                  <div className="csp-footer-name">White Dot LLP</div>
                  <div className="csp-footer-role">Authorized Marketing &amp; Sales · TBM LIMEX</div>
                </div>
              </div>
              <div className="csp-footer-right">
                <a className="csp-explore-link" href={bobbinHref}>Explore More</a>
                <a className="csp-go-btn" href={bobbinHref} aria-label="Open Bobbin case study">→</a>
              </div>
            </div>
          </div>

          <p className="csp-page-footer">© 2026 White Dot LLP · All rights reserved · LIMEX is a trademark of TBM Co., Ltd.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
