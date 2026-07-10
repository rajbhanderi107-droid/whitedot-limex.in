import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Nav from './Nav';
import Footer from './Footer';
import { warmCaseStudyModelCache } from '../productModelPreload';
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
const motorCoverPoster = `${basePath}/case-study/img/motor-cover-hero.jpg`;
const aralditeHref   = `${basePath}/case-study/araldite-container.html`;
const aralditeModel  = `${basePath}/case-study/model/araldite-container-procedural.glb`;
const handWashHref   = `${basePath}/case-study/hand-wash-bottle.html`;
const handWashModel  = `${basePath}/case-study/model/hand-wash-bottle-duo.glb`;
const hardDishHref   = `${basePath}/case-study/product.html?p=hard-dish`;
const hardDishModel  = `${basePath}/case-study/model/lunchbox-tray-four-color-lineup.glb`;
const consilePipeHref  = `${basePath}/case-study/consile-pipe.html`;
const consilePipeModel = `${basePath}/case-study/model/consile-pipe-procedural.glb`;
const soapStandHref  = `${basePath}/case-study/product.html?p=soap-stand`;
const soapStandModel = `${basePath}/case-study/model/soap-stand-procedural.glb`;
const foodOilCanHref  = `${basePath}/case-study/product.html?p=food-oil-can`;
const foodOilCanModel = `${basePath}/case-study/model/oil-bottle-procedural.glb`;
const dairyContainerHref  = `${basePath}/case-study/product.html?p=dairy-products-container`;
const dairyContainerModel = `${basePath}/case-study/model/dairy-container-procedural.glb`;
const lunchboxModel = `${basePath}/case-study/model/lunchbox-tray-four-color-lineup.glb`;
const liveProductModelUrls = [
  bobbinModel,
  containerModel,
  motorCoverModel,
  aralditeModel,
  handWashModel,
  hardDishModel,
  consilePipeModel,
  soapStandModel,
  foodOilCanModel,
  dairyContainerModel,
  lunchboxModel,
];

type ProductKey = 'overview' | 'bobbin' | 'container' | 'motorCover' | 'aralditeContainer' | 'handWashBottle' | 'hardDish' | 'consilePipe' | 'soapStand' | 'foodOilCan' | 'dairyContainer' | 'lunchBox';

const productStats: Record<ProductKey, { value: ReactNode; label: string; green?: boolean }[]> = {
  overview: [
    { value: '10', label: 'Active Studies' },
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
  consilePipe: [
    { value: '07', label: 'Concealed Pipe' },
    { value: 'ISI', label: 'Style Marking' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Live', label: 'Product 07', green: true },
  ],
  soapStand: [
    { value: '08', label: 'Soap Stand' },
    { value: <>15<small>%</small></>, label: 'LIMEX (Sample)' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Live', label: 'Product 08', green: true },
  ],
  foodOilCan: [
    { value: '09', label: 'Food Oil Can' },
    { value: '145', label: 'mm Wide Face' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Live', label: 'Product 09', green: true },
  ],
  dairyContainer: [
    { value: '10', label: 'Dairy Products Container' },
    { value: 'Dairy', label: 'Packaging' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Live', label: 'Product 10', green: true },
  ],
  lunchBox: [
    { value: '11', label: 'Lunchbox Study' },
    { value: '3D', label: 'Interactive Model' },
    { value: '4', label: 'Colorways' },
    { value: 'Live', label: 'Product 11', green: true },
  ],
};

export default function CaseStudyPage() {
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
    window.scrollTo(0, 0);

    if (!isMobileViewport) {
      warmCaseStudyModelCache(liveProductModelUrls);
    }

    // ── Inject model-viewer only on desktop — mobile Safari crashes with multiple WebGL contexts ──
    if (!isMobileViewport && !customElements.get('model-viewer')) {
      const s = document.createElement('script');
      s.type = 'module';
      s.src = `${basePath}/case-study/js/model-viewer.min.js`;
      document.head.appendChild(s);
    }

    // ── Card expand animation ──
    const card = cardRef.current;
    if (card) {
      card.classList.remove('phase-0');
      card.classList.add('expanded');
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
      let nearestProduct: ProductKey | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      grid!.querySelectorAll<HTMLElement>('.csp-pcard').forEach(c => {
        const r     = c.getBoundingClientRect();
        const cx    = r.left + r.width / 2;
        const off   = (cx - centerX) / (sRect.width * 0.5);
        const t     = Math.max(-1.6, Math.min(1.6, off));
        const absT  = Math.abs(t);
        // 3D coverflow transforms promote every card to its own GPU layer —
        // too much memory for iOS Safari. Flat marquee on mobile.
        if (!isMobileViewport) {
          const rotY  = t * 28;
          const scale = 1 - absT * 0.14;
          const tz    = -absT * 60;
          const opa   = Math.max(0.82, 1 - absT * 0.22);
          c.style.transform = `rotateY(${rotY}deg) scale(${scale}) translateZ(${tz}px)`;
          c.style.opacity   = String(opa);
          c.style.zIndex    = String(Math.round((1 - absT) * 10));
        }
        const product = c.dataset.product as ProductKey | undefined;
        if ((product === 'bobbin' || product === 'container' || product === 'motorCover' || product === 'aralditeContainer' || product === 'handWashBottle' || product === 'hardDish' || product === 'consilePipe' || product === 'soapStand' || product === 'foodOilCan' || product === 'dairyContainer') && absT < nearestDistance) {
          nearestProduct = product;
          nearestDistance = absT;
        }
      });
      if (!paused && nearestProduct && nearestDistance < 0.34) {
        setActiveProductKey(nearestProduct);
      }
    }

    function tick() {
      if (!paused) {
        scrollX += speed;
        const half = grid!.scrollWidth / 2;
        if (scrollX >= half) scrollX = 0;
        grid!.style.transform = `translate3d(${-scrollX}px,0,0)`;
      }
      if (allProductsOpenRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      applyCardTransforms();
      rafRef.current = requestAnimationFrame(tick);
    }

    const startTimer = window.setTimeout(() => { rafRef.current = requestAnimationFrame(tick); }, 80);

    // ── Mouse-tracking glow (desktop only) ──
    if (!isMobileViewport) {
      document.querySelectorAll<HTMLElement>('.csp-pcard.live').forEach(c => {
        const glow = c.querySelector<HTMLElement>('.csp-pglow');
        if (!glow) return;
        c.addEventListener('mouseenter', () => {
          const product = c.dataset.product as ProductKey | undefined;
          if (product === 'bobbin' || product === 'container' || product === 'motorCover' || product === 'aralditeContainer' || product === 'handWashBottle' || product === 'hardDish' || product === 'consilePipe' || product === 'soapStand' || product === 'foodOilCan' || product === 'dairyContainer') setActiveProductKey(product);
        });
        c.addEventListener('mousemove', (e: MouseEvent) => {
          const r = c.getBoundingClientRect();
          glow.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
          glow.style.setProperty('--gy', ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%');
        });
      });
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(startTimer);
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
              loading="eager"
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

      {/* 11 Lunchbox - live */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=lunch-box`} data-product="lunchBox">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">11</span>
          {isMobileViewport ? <div className="csp-soon-placeholder">LB</div> : (
            // @ts-ignore custom element
            <model-viewer src={lunchboxModel} alt="Lunchbox - four-colorway 3D model" loading="eager" interaction-prompt="none" shadow-intensity="0.9" exposure="1.1" tone-mapping="neutral" environment-image="neutral" camera-orbit="20deg 78deg 115%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Lunchbox</div><div className="csp-ptag">Food Container - Four Colorways</div><div className="csp-pbar"><span style={{flex:25,height:'100%',background:'#3b4a77',display:'block'}} /><span style={{flex:25,height:'100%',background:'#f2efe6',display:'block'}} /><span style={{flex:25,height:'100%',background:'#ef7250',display:'block'}} /><span style={{flex:25,height:'100%',background:'#a9d4b4',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Navy - White</span><span className="csp-psep">-</span><span className="csp-pdot lx" /><span className="csp-pblabel">Coral - Mint</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 02 — coming soon */}
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
              loading="eager"
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
      {/* 03 Moter Cover - live */}
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
              poster={motorCoverPoster}
              alt="Moter Cover - black vented motor cover 3D model"
              loading="eager"
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
              <span className="csp-pfeatured">New Model</span>
            </div>
            <div className="csp-pname">Moter Cover</div>
            <div className="csp-ptag">Vented Cover - Visual Reference</div>
            <div className="csp-pbar">
              <span style={{ flex:100, height:'100%', background:'var(--cs-green)', display:'block' }} />
            </div>
            <div className="csp-pbarlabels">
              <span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span>
            </div>
          </div>
          <span className="csp-pgo">-&gt;</span>
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
              alt="Araldite Container - LIMEX adhesive dispenser bottle 3D model"
              loading="eager"
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
            <div className="csp-ptag">Adhesive Dispenser - LIMEX + PP</div>
            <div className="csp-pbar">
              <span style={{ flex:30, height:'100%', background:'var(--cs-green)', display:'block' }} />
              <span style={{ flex:70, height:'100%', background:'#c4c7c0', display:'block' }} />
            </div>
            <div className="csp-pbarlabels">
              <span className="csp-pdot pp" /><span className="csp-pblabel">30% LIMEX</span>
              <span className="csp-psep">-</span>
              <span className="csp-pdot lx" /><span className="csp-pblabel">70% PP</span>
            </div>
          </div>
          <span className="csp-pgo">-&gt;</span>
        </div>
      </a>

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
              loading="eager"
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
              loading="eager"
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

      {/* 07 Concealed Pipe - live */}
      <a className="csp-pcard featured live" href={consilePipeHref} data-product="consilePipe">
        <div className="csp-border-beam" />
        <div className="csp-pglass" />
        <div className="csp-pglow" />
        <div className="csp-pmedia">
          <span className="csp-pidx">07</span>
          {isMobileViewport ? (
            <div className="csp-soon-placeholder">CP</div>
          ) : (
            // @ts-ignore custom element
            <model-viewer
              src={consilePipeModel}
              alt="Concealed Pipe - black rigid conduit pipe with blue stripe and embossed ISI marking 3D model"
              loading="eager"
              interaction-prompt="none"
              shadow-intensity="0"
              exposure="1.15"
              tone-mapping="neutral"
              environment-image="neutral"
              camera-orbit="80deg 76deg 60%"
              style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
            />
          )}
        </div>
        <div className="csp-pinfo">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span className="csp-pfeatured">New Model</span>
            </div>
            <div className="csp-pname">Concealed Pipe</div>
            <div className="csp-ptag">Rigid Conduit Pipe - Visual Reference</div>
            <div className="csp-pbar">
              <span style={{ flex:100, height:'100%', background:'var(--cs-green)', display:'block' }} />
            </div>
            <div className="csp-pbarlabels">
              <span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span>
            </div>
          </div>
          <span className="csp-pgo">-&gt;</span>
        </div>
      </a>

      {/* 08 Soap Stand - live */}
      <a className="csp-pcard featured live" href={soapStandHref} data-product="soapStand">
        <div className="csp-border-beam" />
        <div className="csp-pglass" />
        <div className="csp-pglow" />
        <div className="csp-pmedia">
          <span className="csp-pidx">08</span>
          {isMobileViewport ? (
            <div className="csp-soon-placeholder">SS</div>
          ) : (
            // @ts-ignore custom element
            <model-viewer
              src={soapStandModel}
              alt="Soap Stand - covered soap dish with knit-embossed lid, bow and drain insert 3D model"
              loading="eager"
              interaction-prompt="none"
              shadow-intensity="0"
              exposure="1.1"
              tone-mapping="neutral"
              environment-image="neutral"
              camera-orbit="35deg 70deg 92%"
              autoplay
              animation-name="Explode"
              style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
            />
          )}
        </div>
        <div className="csp-pinfo">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span className="csp-pfeatured">New Model</span>
            </div>
            <div className="csp-pname">Soap Stand</div>
            <div className="csp-ptag">Covered Soap Dish - 15% LIMEX Sample</div>
            <div className="csp-pbar">
              <span style={{ flex:15, height:'100%', background:'var(--cs-green)', display:'block' }} />
              <span style={{ flex:85, height:'100%', background:'#d0d3ce', display:'block' }} />
            </div>
            <div className="csp-pbarlabels">
              <span className="csp-pdot pp" /><span className="csp-pblabel">15% LIMEX (marked on sample)</span>
            </div>
          </div>
          <span className="csp-pgo">-&gt;</span>
        </div>
      </a>

      {/* 09 Food Oil Can - live */}
      <a className="csp-pcard featured live" href={foodOilCanHref} data-product="foodOilCan">
        <div className="csp-border-beam" />
        <div className="csp-pglass" />
        <div className="csp-pglow" />
        <div className="csp-pmedia">
          <span className="csp-pidx">09</span>
          {isMobileViewport ? (
            <div className="csp-soon-placeholder">FO</div>
          ) : (
            // @ts-ignore custom element
            <model-viewer
              src={foodOilCanModel}
              alt="Food Oil Can - wide offset-cap oil jug with moulded handle 3D model"
              loading="eager"
              interaction-prompt="none"
              shadow-intensity="0.9"
              shadow-softness="0.8"
              exposure="1.0"
              tone-mapping="neutral"
              environment-image="neutral"
              camera-orbit="22deg 72deg 108%"
              style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
            />
          )}
        </div>
        <div className="csp-pinfo">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span className="csp-pfeatured">New Model</span>
            </div>
            <div className="csp-pname">Food Oil Can</div>
            <div className="csp-ptag">Offset-Cap Oil Can - Visual Reference</div>
            <div className="csp-pbar">
              <span style={{ flex:100, height:'100%', background:'var(--cs-green)', display:'block' }} />
            </div>
            <div className="csp-pbarlabels">
              <span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span>
            </div>
          </div>
          <span className="csp-pgo">-&gt;</span>
        </div>
      </a>

      {/* 10 Dairy Products Container — live */}
      <a className="csp-pcard featured live" href={dairyContainerHref} data-product="dairyContainer">
        <div className="csp-border-beam" />
        <div className="csp-pglass" />
        <div className="csp-pglow" />
        <div className="csp-pmedia">
          <span className="csp-pidx">10</span>
          {isMobileViewport ? (
            <div className="csp-soon-placeholder">DC</div>
          ) : (
            // @ts-ignore custom element
            <model-viewer
              src={dairyContainerModel}
              alt="Dairy Products Container - white round dairy tub 3D model"
              loading="eager"
              interaction-prompt="none"
              shadow-intensity="0.9"
              shadow-softness="0.8"
              exposure="1.0"
              tone-mapping="neutral"
              environment-image="neutral"
              camera-orbit="22deg 76deg 108%"
              style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
            />
          )}
        </div>
        <div className="csp-pinfo">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span className="csp-pfeatured">New Model</span>
            </div>
            <div className="csp-pname">Dairy Products Container</div>
            <div className="csp-ptag">Round Dairy Tub - Visual Reference</div>
            <div className="csp-pbar">
              <span style={{ flex:100, height:'100%', background:'var(--cs-green)', display:'block' }} />
            </div>
            <div className="csp-pbarlabels">
              <span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span>
            </div>
          </div>
          <span className="csp-pgo">-&gt;</span>
        </div>
      </a>
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
                <span className="csp-rw" style={{ '--wd':'0.48s', fontSize: '10px', fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--cs-green)', display: 'inline-block' } as React.CSSProperties}>Studies</span>
              </div>
              <h1 className="csp-h1">
                <span className="csp-rw" style={{ '--wd':'0.56s' } as React.CSSProperties}>Explore</span>{' '}
                <span className="csp-rw" style={{ '--wd':'0.64s' } as React.CSSProperties}>Products</span>{' '}
                <span className="csp-rw" style={{ '--wd':'0.72s' } as React.CSSProperties}>Reimagined</span><br />
                <span className="csp-rw" style={{ '--wd':'0.8s' } as React.CSSProperties}>in </span>
                <span className="csp-rw csp-accent" style={{ '--wd':'0.88s' } as React.CSSProperties}>LIMEX</span>
              </h1>
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
            <div className={`csp-grid-section${allProductsOpen ? ' csp-grid-section--all' : ''}`} ref={sectionRef}>
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

          <p className="csp-page-footer">© 2026 White Dot LLP · All rights reserved · LIMEX is a trademark of TBM Co., Ltd.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
