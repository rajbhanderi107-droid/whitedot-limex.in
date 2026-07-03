import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import './CaseStudyPage.css';

const basePath = window.location.hostname.endsWith('github.io') ? '/whitedot-limex.in' : '';

// iOS Safari crashes when multiple WebGL contexts (model-viewer) are active simultaneously.
// Serve static placeholders on mobile; interactive 3D only on desktop (≥1024px).
const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 1024;
const bobbinHref  = `${basePath}/case-study/bobbin.html`;
const bobbinModel = `${basePath}/case-study/model/bobbin.glb`;
const containerHref  = `${basePath}/case-study/container.html`;
const containerModel = `${basePath}/case-study/model/paint-container-procedural-red-white.glb`;
const motorCoverHref   = `${basePath}/case-study/motor-cover.html`;
const motorCoverModel  = `${basePath}/case-study/model/motor-cover-procedural-black.glb`;
const aralditeHref   = `${basePath}/case-study/araldite-container.html`;
const aralditeModel  = `${basePath}/case-study/model/araldite-container-procedural.glb`;
const handWashHref   = `${basePath}/case-study/hand-wash-bottle.html`;
const handWashModel  = `${basePath}/case-study/model/hand-wash-bottle-duo.glb`;
const hardDishHref   = `${basePath}/case-study/product.html?p=hard-dish`;
const hardDishModel  = `${basePath}/case-study/model/lunchbox-tray-four-color-lineup.glb`;

type ProductKey = 'overview' | 'bobbin' | 'container' | 'motorCover' | 'aralditeContainer' | 'handWashBottle' | 'hardDish';
const liveProductKeys = new Set<ProductKey>(['bobbin', 'container', 'motorCover', 'aralditeContainer', 'handWashBottle', 'hardDish']);

// Pending products — same card as live ones; 3D model + spec details land later.
const pendingProducts: { idx: string; slug: string; name: string; tag: string }[] = [
  { idx: '07', slug: 'consile-pipe', name: 'Consile Pipe', tag: 'Industrial Pipe' },
  { idx: '08', slug: 'soap-stand', name: 'Soap Stand', tag: 'Bathroom Accessory' },
  { idx: '09', slug: 'food-oil-can', name: 'Food Oil Can', tag: 'Food Packaging' },
  { idx: '10', slug: 'dairy-products-container', name: 'Dairy Products Container', tag: 'Dairy Packaging' },
  { idx: '11', slug: 'lunch-box', name: 'Lunch Box', tag: 'Food Container' },
  { idx: '12', slug: 'dairy-sweet-container', name: 'Dairy Sweet Container', tag: 'Dairy Packaging' },
  { idx: '13', slug: 'dairy-round-container', name: 'Dairy Round Container', tag: 'Dairy Packaging' },
  { idx: '14', slug: 'rectangle-container', name: 'Rectangle Container', tag: 'General Packaging' },
  { idx: '15', slug: '20mm-hook', name: '20 mm Hook', tag: 'Hardware' },
  { idx: '16', slug: 'round-pipe', name: 'Round Pipe', tag: 'Industrial Pipe' },
  { idx: '17', slug: 'appliance-tray', name: 'Fridge / Washing Machine Tray', tag: 'Appliance Component' },
  { idx: '18', slug: 'motor-fan-blade', name: 'Motor Fan Blade', tag: 'Motor Component' },
  { idx: '19', slug: 'cup-container', name: 'Cup Container', tag: 'Food Packaging' },
  { idx: '20', slug: 'tooth-brush', name: 'Tooth Brush', tag: 'Personal Care' },
  { idx: '21', slug: 'petrol-pipe', name: 'Petrol Pipe', tag: 'Automotive Component' },
  { idx: '22', slug: 'protein-container', name: 'Protein Container', tag: 'Nutrition Packaging' },
  { idx: '23', slug: 'rectangle-box', name: 'Rectangle Box', tag: 'General Packaging' },
  { idx: '24', slug: 'small-round-bottle', name: 'Small Round Bottle', tag: 'General Packaging' },
  { idx: '25', slug: 'salt-bottle', name: 'Salt Bottle', tag: 'Food Packaging' },
  { idx: '26', slug: 'light-weight-container', name: 'Light Weight Container', tag: 'General Packaging' },
  { idx: '27', slug: 'food-tray-dish', name: 'Food Tray Dish', tag: 'Food Packaging' },
  { idx: '28', slug: 'light-weight-dish', name: 'Light Weight Dish', tag: 'Kitchenware' },
  { idx: '29', slug: 'dermicool-powder-bottle', name: 'Dermicool Powder Bottle', tag: 'Personal Care Packaging' },
  { idx: '30', slug: 'woven-thread', name: 'Woven Thread', tag: 'Textile Material' },
  { idx: '31', slug: 'child-bottle', name: 'Child Bottle', tag: 'Personal Care Packaging' },
  { idx: '32', slug: 'water-tub', name: 'Water Tub', tag: 'Household Storage' },
  { idx: '33', slug: 'toilet-seat', name: 'Toilet Seat', tag: 'Sanitaryware' },
  { idx: '34', slug: 'non-woven-bag', name: 'Non Woven Bag', tag: 'Packaging Textile' },
  { idx: '35', slug: 'courier-bag', name: 'Courier Bag', tag: 'Logistics Packaging' },
];

function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const productStats: Record<ProductKey, { value: ReactNode; label: string; green?: boolean }[]> = {
  overview: [
    { value: '35', label: 'Products in LIMEX' },
    { value: '3D', label: 'Interactive' },
    { value: <>100<small>%</small></>, label: 'LIMEX + Color' },
    { value: <>~38<small>%</small></>, label: 'CO2e Cut (LCA)', green: true },
  ],
  bobbin: [
    { value: '01', label: 'Bobbin Study' },
    { value: <>40<small>%</small></>, label: 'LIMEX' },
    { value: <>60<small>%</small></>, label: 'PP' },
    { value: <>~31<small>%</small></>, label: 'Limestone in Part', green: true },
  ],
  container: [
    { value: '02', label: 'Paint Container' },
    { value: <>25<small>%</small></>, label: 'LIMEX' },
    { value: <>75<small>%</small></>, label: 'PP' },
    { value: <>~20<small>%</small></>, label: 'Limestone in Part', green: true },
  ],
  motorCover: [
    { value: '03', label: 'Motor Cover' },
    { value: <>50<small>%</small></>, label: 'LIMEX' },
    { value: <>50<small>%</small></>, label: 'PP' },
    { value: <>~39<small>%</small></>, label: 'Limestone in Part', green: true },
  ],
  aralditeContainer: [
    { value: '04', label: 'Araldite Container' },
    { value: <>30<small>%</small></>, label: 'LIMEX' },
    { value: <>70<small>%</small></>, label: 'PP' },
    { value: <>~23<small>%</small></>, label: 'Limestone in Part', green: true },
  ],
  handWashBottle: [
    { value: '05', label: 'Hand Wash Bottle' },
    { value: '2', label: 'Colorways' },
    { value: '3D', label: 'Static Preview' },
    { value: 'Live', label: 'Product 05', green: true },
  ],
  hardDish: [
    { value: '06', label: 'Hard Dish' },
    { value: '4', label: 'Colorways' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Live', label: 'Product 06', green: true },
  ],
};

export default function CaseStudyFeature() {
  const cardRef    = useRef<HTMLDivElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number>(0);
  const activeProductRef = useRef<ProductKey>('overview');
  const allProductsOpenRef = useRef(false);
  const [activeProduct, setActiveProduct] = useState<ProductKey>('overview');
  const [allProductsOpen, setAllProductsOpen] = useState(false);
  const setActiveProductKey = useCallback((key: ProductKey) => {
    if (activeProductRef.current === key) return;
    activeProductRef.current = key;
    setActiveProduct(key);
  }, []);
  const showAllProducts = useCallback(() => {
    allProductsOpenRef.current = true;
    setAllProductsOpen(true);
    setActiveProductKey('overview');
    requestAnimationFrame(() => {
      gridRef.current?.querySelectorAll<HTMLElement>('.csp-pcard').forEach((card) => {
        card.style.transform = 'none';
        card.style.opacity = '1';
        card.style.zIndex = '1';
      });
      if (gridRef.current) gridRef.current.style.transform = 'none';
    });
  }, [setActiveProductKey]);
  const hideAllProducts = useCallback(() => {
    allProductsOpenRef.current = false;
    setAllProductsOpen(false);
    setActiveProductKey('overview');
  }, [setActiveProductKey]);

  useEffect(() => {
    // ── Inject model-viewer only on desktop — mobile Safari crashes with multiple WebGL contexts ──
    if (!isMobileViewport && !customElements.get('model-viewer')) {
      const s = document.createElement('script');
      s.type = 'module';
      s.src = `${basePath}/case-study/js/model-viewer.min.js`;
      document.head.appendChild(s);
    }

    // ── 3D Coverflow marquee ──
    const grid    = gridRef.current;
    const section = sectionRef.current;
    if (!grid || !section) return;

    let scrollX  = 0;
    const speed  = 0.65;
    let paused   = false;
    let visible  = false;

    grid.addEventListener('mouseenter', () => { paused = true; });
    grid.addEventListener('mouseleave', () => { paused = false; });

    function applyCardTransforms() {
      const sRect   = section!.getBoundingClientRect();
      const centerX = sRect.left + sRect.width / 2;
      let nearestProduct: ProductKey | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
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
        const product = c.dataset.product as ProductKey | undefined;
        if (product && liveProductKeys.has(product) && absT < nearestDistance) {
          nearestProduct = product;
          nearestDistance = absT;
        }
      });
      if (!paused && nearestProduct && nearestDistance < 0.34) {
        setActiveProductKey(nearestProduct);
      }
    }

    function tick() {
      // Pause RAF loop when section is off-screen to save CPU/GPU on mobile.
      if (!visible) {
        rafRef.current = 0;
        return;
      }
      if (!paused) {
        scrollX += speed;
        const half = grid!.scrollWidth / 2;
        if (scrollX >= half) scrollX = 0;
        grid!.style.transform = `translate3d(${-scrollX}px,0,0)`;
      }
      if (!allProductsOpenRef.current) {
        applyCardTransforms();
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    // Gate the RAF loop on visibility so it doesn't run offscreen.
    const visIO = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !rafRef.current) {
          rafRef.current = requestAnimationFrame(tick);
        }
      },
      { threshold: 0 },
    );
    visIO.observe(section);

    // ── Mouse-tracking glow (desktop only) ──
    if (!isMobileViewport) {
      section.querySelectorAll<HTMLElement>('.csp-pcard.live').forEach(c => {
        const glow = c.querySelector<HTMLElement>('.csp-pglow');
        if (!glow) return;
        c.addEventListener('mouseenter', () => {
          const product = c.dataset.product as ProductKey | undefined;
          if (product && liveProductKeys.has(product)) setActiveProductKey(product);
        });
        c.addEventListener('mousemove', (e: MouseEvent) => {
          const r = c.getBoundingClientRect();
          glow.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
          glow.style.setProperty('--gy', ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%');
        });
      });
    }

    return () => {
      visIO.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [setActiveProductKey]);

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
          {isMobileViewport ? (
            <div className="csp-soon-placeholder">BO</div>
          ) : (
            // @ts-ignore custom element
            <model-viewer
              src={bobbinModel}
              alt="Bobbin — LIMEX textile bobbin 3D model"
              loading="lazy"
              interaction-prompt="none"
              shadow-intensity="0"
              exposure="1.15"
              tone-mapping="neutral"
              environment-image="neutral"
              camera-orbit="30deg 75deg 105%"
              style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
            />
          )}
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

      {/* 02 Paint Container — live */}
      <a className="csp-pcard featured live" href={containerHref} data-product="container">
        <div className="csp-border-beam" />
        <div className="csp-pglass" />
        <div className="csp-pglow" />
        <div className="csp-pmedia">
          <span className="csp-pidx">02</span>
          {isMobileViewport ? (
            <div className="csp-soon-placeholder">PC</div>
          ) : (
            // @ts-ignore custom element
            <model-viewer
              src={containerModel}
              alt="Paint container - red body and bright white snap lid 3D model"
              loading="lazy"
              interaction-prompt="none"
              shadow-intensity="0"
              exposure="1.08"
              tone-mapping="neutral"
              environment-image="neutral"
              camera-orbit="28deg 72deg 108%"
              style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
            />
          )}
        </div>
        <div className="csp-pinfo">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span className="csp-pfeatured">New Study</span>
            </div>
            <div className="csp-pname">Paint Container</div>
            <div className="csp-ptag">Paint Pail - 25% LIMEX</div>
            <div className="csp-pbar">
              <span style={{ flex:25, height:'100%', background:'var(--cs-green)', display:'block' }} />
              <span style={{ flex:75, height:'100%', background:'#c4c7c0', display:'block' }} />
            </div>
            <div className="csp-pbarlabels">
              <span className="csp-pdot pp" /><span className="csp-pblabel">25% LIMEX</span>
              <span className="csp-psep">·</span>
              <span className="csp-pdot lx" /><span className="csp-pblabel">75% PP</span>
            </div>
          </div>
          <span className="csp-pgo">→</span>
        </div>
      </a>
      {/* 03 Motor Cover - live */}
      <a className="csp-pcard featured live" href={motorCoverHref} data-product="motorCover">
        <div className="csp-border-beam" />
        <div className="csp-pglass" />
        <div className="csp-pglow" />
        <div className="csp-pmedia">
          <span className="csp-pidx">03</span>
          {isMobileViewport ? (
            <div className="csp-soon-placeholder">MC</div>
          ) : (
            // @ts-ignore custom element
            <model-viewer
              src={motorCoverModel}
              alt="Motor Cover — black vented motor fan cover 3D model"
              loading="lazy"
              interaction-prompt="none"
              shadow-intensity="0"
              exposure="1.16"
              tone-mapping="neutral"
              environment-image="neutral"
              camera-orbit="25deg 78deg 112%"
              style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
            />
          )}
        </div>
        <div className="csp-pinfo">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span className="csp-pfeatured">New Study</span>
            </div>
            <div className="csp-pname">Motor Cover</div>
            <div className="csp-ptag">Motor Fan Cover · 50% LIMEX</div>
            <div className="csp-pbar">
              <span style={{ flex:50, height:'100%', background:'var(--cs-green)', display:'block' }} />
              <span style={{ flex:50, height:'100%', background:'#c4c7c0', display:'block' }} />
            </div>
            <div className="csp-pbarlabels">
              <span className="csp-pdot pp" /><span className="csp-pblabel">50% LIMEX</span>
              <span className="csp-psep">·</span>
              <span className="csp-pdot lx" /><span className="csp-pblabel">50% PP</span>
            </div>
          </div>
          <span className="csp-pgo">→</span>
        </div>
      </a>
      {/* 04 Araldite Container - live */}
      <a className="csp-pcard featured live" href={aralditeHref} data-product="aralditeContainer">
        <div className="csp-border-beam" />
        <div className="csp-pglass" />
        <div className="csp-pglow" />
        <div className="csp-pmedia">
          <span className="csp-pidx">04</span>
          {isMobileViewport ? (
            <div className="csp-soon-placeholder">AC</div>
          ) : (
            // @ts-ignore custom element
            <model-viewer
              src={aralditeModel}
              poster={`${basePath}/case-study/img/araldite-poster.jpg`}
              alt="Araldite Container — LIMEX adhesive dispenser bottle 3D model"
              loading="lazy"
              interaction-prompt="none"
              shadow-intensity="0.9"
              shadow-softness="0.8"
              exposure="1.22"
              tone-mapping="neutral"
              environment-image="legacy"
              camera-orbit="30deg 72deg 115%"
              style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
            />
          )}
        </div>
        <div className="csp-pinfo">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span className="csp-pfeatured">New Study</span>
            </div>
            <div className="csp-pname">Araldite Container</div>
            <div className="csp-ptag">Adhesive Dispenser · LIMEX + PP</div>
            <div className="csp-pbar">
              <span style={{ flex:30, height:'100%', background:'var(--cs-green)', display:'block' }} />
              <span style={{ flex:70, height:'100%', background:'#c4c7c0', display:'block' }} />
            </div>
            <div className="csp-pbarlabels">
              <span className="csp-pdot pp" /><span className="csp-pblabel">30% LIMEX</span>
              <span className="csp-psep">·</span>
              <span className="csp-pdot lx" /><span className="csp-pblabel">70% PP</span>
            </div>
          </div>
          <span className="csp-pgo">→</span>
        </div>
      </a>

      {/* 05 Hand Wash Bottle — live */}
      <a className="csp-pcard featured live" href={handWashHref} data-product="handWashBottle">
        <div className="csp-border-beam" />
        <div className="csp-pglass" />
        <div className="csp-pglow" />
        <div className="csp-pmedia">
          <span className="csp-pidx">05</span>
          {isMobileViewport ? (
            <div className="csp-soon-placeholder">HW</div>
          ) : (
            // @ts-ignore custom element
            <model-viewer
              src={handWashModel}
              alt="Hand Wash Bottle - white and green faceted LIMEX pump bottles 3D model"
              loading="lazy"
              interaction-prompt="none"
              shadow-intensity="0.9"
              shadow-softness="0.8"
              exposure="1.22"
              tone-mapping="neutral"
              environment-image="legacy"
              camera-orbit="20deg 78deg 120%"
              style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
            />
          )}
        </div>
        <div className="csp-pinfo">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span className="csp-pfeatured">New Study</span>
            </div>
            <div className="csp-pname">Hand Wash Bottle</div>
            <div className="csp-ptag">Personal Care Packaging - Two Colorways</div>
            <div className="csp-pbar">
              <span style={{ flex:50, height:'100%', background:'#f2efe6', display:'block' }} />
              <span style={{ flex:50, height:'100%', background:'var(--cs-green)', display:'block' }} />
            </div>
            <div className="csp-pbarlabels">
              <span className="csp-pdot pp" /><span className="csp-pblabel">White</span>
              <span className="csp-psep">-</span>
              <span className="csp-pdot lx" /><span className="csp-pblabel">Green</span>
            </div>
          </div>
          <span className="csp-pgo">-&gt;</span>
        </div>
      </a>

      {/* 06 Hard Dish - live */}
      <a className="csp-pcard featured live" href={hardDishHref} data-product="hardDish">
        <div className="csp-border-beam" />
        <div className="csp-pglass" />
        <div className="csp-pglow" />
        <div className="csp-pmedia">
          <span className="csp-pidx">06</span>
          {isMobileViewport ? (
            <div className="csp-soon-placeholder">HD</div>
          ) : (
            // @ts-ignore custom element
            <model-viewer
              src={hardDishModel}
              alt="Hard Dish - four-colorway 3-compartment LIMEX serving dish 3D model"
              loading="lazy"
              interaction-prompt="none"
              shadow-intensity="0.9"
              shadow-softness="0.8"
              exposure="1.22"
              tone-mapping="neutral"
              environment-image="legacy"
              camera-orbit="20deg 80deg 115%"
              style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
            />
          )}
        </div>
        <div className="csp-pinfo">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span className="csp-pfeatured">New Model</span>
            </div>
            <div className="csp-pname">Hard Dish</div>
            <div className="csp-ptag">Kitchenware - Four Colorways</div>
            <div className="csp-pbar">
              <span style={{ flex:25, height:'100%', background:'#3b4a77', display:'block' }} />
              <span style={{ flex:25, height:'100%', background:'#f2efe6', display:'block' }} />
              <span style={{ flex:25, height:'100%', background:'#ef7250', display:'block' }} />
              <span style={{ flex:25, height:'100%', background:'#a9d4b4', display:'block' }} />
            </div>
            <div className="csp-pbarlabels">
              <span className="csp-pdot pp" /><span className="csp-pblabel">Navy - White</span>
              <span className="csp-psep">-</span>
              <span className="csp-pdot lx" /><span className="csp-pblabel">Coral - Mint</span>
            </div>
          </div>
          <span className="csp-pgo">-&gt;</span>
        </div>
      </a>

      {pendingProducts.map(p => (
        <a
          key={p.slug}
          className="csp-pcard featured live"
          href={`${basePath}/case-study/product.html?p=${p.slug}`}
          data-product={p.slug}
        >
          <div className="csp-border-beam" />
          <div className="csp-pglass" />
          <div className="csp-pglow" />
          <div className="csp-pmedia">
            <span className="csp-pidx">{p.idx}</span>
            <div className="csp-soon-placeholder">{monogram(p.name)}</div>
          </div>
          <div className="csp-pinfo">
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <span className="csp-pfeatured">Coming Soon</span>
              </div>
              <div className="csp-pname">{p.name}</div>
              <div className="csp-ptag">{p.tag}</div>
            </div>
            <span className="csp-pgo">→</span>
          </div>
        </a>
      ))}
    </>
  );

  return (
    <section className="csp-main csp-main--section" id="case-studies" ref={sectionRef}>
      <div className="csp-page csp-page--section">
        <div className="csp-hero-card csp-hero-card--flat expanded" ref={cardRef} id="cspHeroCard">
          {/* Floating blobs */}
          <div className="csp-blobs" aria-hidden="true">
            <div className="csp-blob csp-blob--orange" />
            <div className="csp-blob csp-blob--green" />
          </div>

          {/* Headline */}
          <div className="csp-card-hero">
            <div className="csp-eyebrow" style={{ marginBottom: '16px' }}>
              <span className="csp-rw" style={{ '--wd':'0.02s', fontSize: '10px', fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--cs-green)', display: 'inline-block' } as React.CSSProperties}>Case</span>{' '}
              <span className="csp-rw" style={{ '--wd':'0.08s', fontSize: '10px', fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--cs-green)', display: 'inline-block' } as React.CSSProperties}>Studies</span>
            </div>
            <h2 className="csp-h1" style={{ fontSize: 'clamp(28px, 3.8vw, 52px)', margin: '0 0 28px 0', lineHeight: 1.08 }}>
              <span className="csp-rw" style={{ '--wd':'0.14s', opacity: 1 } as React.CSSProperties}>Products</span>{' '}
              <span className="csp-rw" style={{ '--wd':'0.20s', opacity: 1 } as React.CSSProperties}>Reimagined</span><br />
              <span className="csp-rw" style={{ '--wd':'0.26s', opacity: 1 } as React.CSSProperties}>in </span>
              <span className="csp-rw csp-accent" style={{ '--wd':'0.32s', opacity: 1 } as React.CSSProperties}>LIMEX</span>
            </h2>
            <p className="csp-hsub">Everyday plastic parts, rebuilt with limestone-based material. Select a product to explore it in 3D and see how its composition changes.</p>
            <div className="csp-hstats" data-active-product={activeProduct}>
              {productStats[activeProduct].map((stat, index) => (
                <div className="csp-hs-cell" key={`${activeProduct}-${index}`}>
                  {index > 0 && <div className="csp-hs-div" />}
                  <div className="csp-hs-item">
                    <span className={`csp-hs-num${stat.green ? ' csp-hs-num--green' : ''}`}>{stat.value}</span>
                    <span className="csp-hs-label">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product marquee */}
          <div className={`csp-grid-section${allProductsOpen ? ' csp-grid-section--all' : ''}`}>
            <div className="csp-lens-wrap">
              <div className="csp-pgrid" ref={gridRef}>
                {cards}
                {!allProductsOpen && cards}
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
              {allProductsOpen ? (
                <>
                  <button className="csp-go-btn" type="button" onClick={hideAllProducts} aria-label="Back to product carousel">←</button>
                  <button className="csp-explore-link" type="button" onClick={hideAllProducts}>Back to Products</button>
                </>
              ) : (
                <>
                  <button className="csp-explore-link" type="button" onClick={showAllProducts}>Explore New Study</button>
                  <button className="csp-go-btn" type="button" onClick={showAllProducts} aria-label="Show all case study products">→</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
