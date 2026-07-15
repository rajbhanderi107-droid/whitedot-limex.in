import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { observeViewportModels, warmCaseStudyModelCache } from '../productModelPreload';
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
const consilePipeHref  = `${basePath}/case-study/consile-pipe.html`;
const consilePipeModel = `${basePath}/case-study/model/consile-pipe-procedural.glb`;
const soapStandHref  = `${basePath}/case-study/product.html?p=soap-stand`;
const soapStandModel = `${basePath}/case-study/model/soap-stand-procedural.glb`;
const foodOilCanHref  = `${basePath}/case-study/product.html?p=food-oil-can`;
const foodOilCanModel = `${basePath}/case-study/model/oil-bottle-procedural.glb`;
const dairyContainerHref  = `${basePath}/case-study/product.html?p=dairy-products-container`;
const dairyContainerModel = `${basePath}/case-study/model/dairy-container-procedural.glb`;
const lunchBoxHref = `${basePath}/case-study/product.html?p=lunch-box`;
const lunchBoxModel = `${basePath}/case-study/model/lunch-box.glb`;
const dairySweetContainerHref = `${basePath}/case-study/product.html?p=dairy-sweet-container`;
const dairySweetContainerModel = `${basePath}/case-study/model/dairy-sweet-container-procedural.glb`;
const dairyRoundContainerHref = `${basePath}/case-study/product.html?p=dairy-round-container`;
const dairyRoundContainerModel = `${basePath}/case-study/model/Havmor_D500_Bowl.glb`;
const rectangleContainerHref = `${basePath}/case-study/product.html?p=rectangle-container`;
const rectangleContainerModel = `${basePath}/case-study/model/rectangle-container-d250.glb`;
const roundPipeModel = `${basePath}/case-study/model/round-pipe-procedural.glb`;
const hook20mmHref = `${basePath}/case-study/product.html?p=20mm-hook`;
const hook20mmModel = `${basePath}/case-study/model/product-15-g1-clip.glb`;
const applianceTrayModel = `${basePath}/case-study/model/product-17-appliance-tray.glb`;
const motorFanBladeModel = `${basePath}/case-study/model/product-18-impeller.glb`;
const cupContainerModel = `${basePath}/case-study/model/product-19-cup-container.glb`;
const toothBrushModel = `${basePath}/case-study/model/product-20-toothbrush-collection.glb`;
type ProductKey = 'overview' | 'bobbin' | 'container' | 'motorCover' | 'aralditeContainer' | 'handWashBottle' | 'hardDish' | 'consilePipe' | 'soapStand' | 'foodOilCan' | 'dairyProductsContainer' | 'lunchBox' | 'dairySweetContainer' | 'dairyRoundContainer' | 'rectangleContainer' | 'hook20mm' | 'roundPipe' | 'applianceTray' | 'motorFanBlade' | 'cupContainer' | 'toothBrush';
const liveProductKeys = new Set<ProductKey>(['bobbin', 'container', 'motorCover', 'aralditeContainer', 'handWashBottle', 'hardDish', 'consilePipe', 'soapStand', 'foodOilCan', 'dairyProductsContainer', 'lunchBox', 'dairySweetContainer', 'dairyRoundContainer', 'rectangleContainer', 'hook20mm', 'roundPipe', 'applianceTray', 'motorFanBlade', 'cupContainer', 'toothBrush']);

// Pending products — same card as live ones; 3D model + spec details land later.
const pendingProducts: { idx: string; slug: string; name: string; tag: string }[] = [
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
  dairyProductsContainer: [
    { value: '10', label: 'Dairy Container' },
    { value: '1', label: 'Snap-Fit Lid + Tab' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Live', label: 'Product 10', green: true },
  ],
  lunchBox: [
    { value: '11', label: 'Lunch Box' },
    { value: '3D', label: 'Interactive Model' },
    { value: 'Mini', label: 'Bento Container' },
    { value: 'Live', label: 'Product 11', green: true },
  ],
  dairySweetContainer: [
    { value: '12', label: 'Dairy Sweet Container' },
    { value: '200×140×50', label: 'mm Compact Envelope' },
    { value: 'PP', label: 'Food-Grade Material' },
    { value: 'Live', label: 'Product 12', green: true },
  ],
  dairyRoundContainer: [
    { value: '13', label: 'Havmor D500 Bowl' },
    { value: '3D', label: 'Interactive Model' },
    { value: 'D500', label: 'Dairy Bowl' },
    { value: 'Live', label: 'Product 13', green: true },
  ],
  rectangleContainer: [
    { value: '14', label: 'HAVMOR D-250 Container' },
    { value: '250×190', label: 'mm Envelope' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Live', label: 'Product 14', green: true },
  ],
  hook20mm: [
    { value: '15', label: '20 mm Hook' },
    { value: '19', label: 'mm Overall Width' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Live', label: 'Product 15', green: true },
  ],
  roundPipe: [
    { value: '16', label: 'Round Pipe' },
    { value: '3D', label: 'Interactive Model' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 16', green: true },
  ],
  applianceTray: [
    { value: '17', label: 'Fridge / Washing Machine Tray' },
    { value: '3D', label: 'Interactive Model' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 17', green: true },
  ],
  motorFanBlade: [
    { value: '18', label: 'Motor Fan Blade' },
    { value: '12', label: 'Radial Blades' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 18', green: true },
  ],
  cupContainer: [
    { value: '19', label: 'Cup Container' },
    { value: '95×95×149.75', label: 'mm Envelope' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 19', green: true },
  ],
  toothBrush: [
    { value: '20', label: 'Tooth Brush' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 20', green: true },
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
    // Homepage embed — competes with the hero video/images for bandwidth on
    // first paint, so only warm the couple of cards visible without scrolling.
    // The rest lean on observeViewportModels' widened rootMargin instead.
    const stopViewportModels = observeViewportModels(grid);
    const product13Warmup = window.setTimeout(
      () => warmCaseStudyModelCache([bobbinModel, containerModel, motorCoverModel]),
      900,
    );

    let scrollX  = 0;
    const speed  = 0.65;
    let paused   = false;
    let visible  = false;

    grid.addEventListener('mouseenter', () => { paused = true; });
    grid.addEventListener('mouseleave', () => { paused = false; });

    const cardEls = [...grid.querySelectorAll<HTMLElement>('.csp-pcard')];

    function applyCardTransforms() {
      const sRect   = section!.getBoundingClientRect();
      const centerX = sRect.left + sRect.width / 2;
      const halfW   = sRect.width * 0.5;
      let nearestProduct: ProductKey | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      // ── READ PASS ── measure every card first, before touching any style.
      // Interleaving getBoundingClientRect() with style writes forced a
      // synchronous reflow per card (~56 cards) every frame — the marquee's
      // main-thread jank. Batching all reads, then all writes, is one reflow
      // per frame instead of one per card.
      const offsets = cardEls.map((c) => {
        const r  = c.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        return Math.max(-1.6, Math.min(1.6, (cx - centerX) / halfW));
      });

      // ── WRITE PASS ── apply transforms; no layout reads in this loop.
      cardEls.forEach((c, i) => {
        const t    = offsets[i];
        const absT = Math.abs(t);
        // 3D coverflow transforms promote every card (~70 with the duplicated
        // list) to its own GPU layer — too much memory for iOS Safari. Flat
        // marquee on mobile; the grid's translate3d still scrolls the strip.
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
      stopViewportModels();
      window.clearTimeout(product13Warmup);
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
              data-model-src={bobbinModel}
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
              data-model-src={containerModel}
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
              data-model-src={motorCoverModel}
              alt="Motor Cover — black vented motor fan cover 3D model"
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
              data-model-src={aralditeModel}
              poster={`${basePath}/case-study/img/araldite-poster.jpg`}
              alt="Araldite Container — LIMEX adhesive dispenser bottle 3D model"
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
              data-model-src={handWashModel}
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
              data-model-src={hardDishModel}
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
              data-model-src={consilePipeModel}
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
              data-model-src={soapStandModel}
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
              data-model-src={foodOilCanModel}
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

      {/* 10 Dairy Products Container - live */}
      <a className="csp-pcard featured live" href={dairyContainerHref} data-product="dairyProductsContainer">
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
              data-model-src={dairyContainerModel}
              alt="Dairy Products Container - tapered round tub with snap-fit lid and tamper-seal tab 3D model"
              loading="eager"
              interaction-prompt="none"
              shadow-intensity="0.9"
              shadow-softness="0.8"
              exposure="1.0"
              tone-mapping="neutral"
              environment-image="neutral"
              camera-orbit="18deg 74deg 108%"
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
            <div className="csp-ptag">Snap-Lid Dairy Tub - Visual Reference</div>
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

      {/* 11 Lunch Box - live, original mini-bento model */}
      <a className="csp-pcard featured live" href={lunchBoxHref} data-product="lunchBox">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">11</span>
          {isMobileViewport ? <div className="csp-soon-placeholder">LB</div> : (
            // @ts-ignore custom element
            <model-viewer data-model-src={lunchBoxModel} alt="Lunch Box mini bento container 3D model" loading="eager" interaction-prompt="none" shadow-intensity="0.9" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="38deg 68deg 108%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Lunch Box</div><div className="csp-ptag">Mini Bento Container - Visual Reference</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 12 Dairy Sweet Container - live */}
      <a
          className="csp-pcard featured live"
          href={dairySweetContainerHref}
          data-product="dairySweetContainer"
        >
          <div className="csp-border-beam" />
          <div className="csp-pglass" />
          <div className="csp-pglow" />
          <div className="csp-pmedia">
            <span className="csp-pidx">12</span>
            {isMobileViewport ? <div className="csp-soon-placeholder">DS</div> : (
              // @ts-ignore custom element
              <model-viewer
              data-model-src={dairySweetContainerModel}
                alt="Dairy Sweet Container - D-500 food-grade PP container 3D model"
              loading="eager"
                interaction-prompt="none"
                shadow-intensity="0.75"
                shadow-softness="0.8"
                exposure="1.0"
                tone-mapping="neutral"
                environment-image="legacy"
                camera-orbit="18deg 76deg 112%"
                style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
              />
            )}
          </div>
          <div className="csp-pinfo">
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}><span className="csp-pfeatured">New Model</span></div>
              <div className="csp-pname">Dairy Sweet Container</div>
              <div className="csp-ptag">Compact PP Container - Smaller Than Product 14</div>
              <div className="csp-pbar"><span style={{ flex:100, height:'100%', background:'var(--cs-green)', display:'block' }} /></div>
              <div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Food-grade PP</span></div>
            </div>
            <span className="csp-pgo">-&gt;</span>
          </div>
        </a>

      {/* 13 Havmor D500 Bowl - live */}
      <a className="csp-pcard featured live" href={dairyRoundContainerHref} data-product="dairyRoundContainer">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">13</span>
          {isMobileViewport ? <div className="csp-soon-placeholder">D5</div> : (
            // @ts-ignore custom element
            <model-viewer data-model-src={dairyRoundContainerModel} alt="Havmor D500 Bowl 3D model" loading="eager" interaction-prompt="none" shadow-intensity="0.9" shadow-softness="0.8" exposure="1.08" tone-mapping="neutral" environment-image="neutral" camera-orbit="18deg 72deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Havmor D500 Bowl</div><div className="csp-ptag">Dairy Packaging - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 14 HAVMOR D-250 Rectangle Container - live */}
      <a className="csp-pcard featured live" href={rectangleContainerHref} data-product="rectangleContainer">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">14</span>
          {isMobileViewport ? <div className="csp-soon-placeholder">D2</div> : (
            // @ts-ignore custom element
            <model-viewer data-model-src={rectangleContainerModel} alt="HAVMOR D-250 rectangular container 3D model" loading="eager" interaction-prompt="none" shadow-intensity="0.9" shadow-softness="0.75" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="18deg 70deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">HAVMOR D-250 Container</div><div className="csp-ptag">One-Piece Molded Plastic Container - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Photo-matched geometry</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 15 20 mm Hook — live (newest); shown in numeric sequence after 14 */}
      <a className="csp-pcard featured live" href={hook20mmHref} data-product="hook20mm">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">15</span>
          {isMobileViewport ? <div className="csp-soon-placeholder">G1</div> : (
            // @ts-ignore custom element
            <model-viewer data-model-src={hook20mmModel} alt="20 mm hook plastic 3D model" loading="eager" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="0.85" tone-mapping="neutral" environment-image="neutral" camera-orbit="42deg 68deg 105%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">20 mm Hook</div><div className="csp-ptag">Hardware - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Photo-matched geometry</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 16 Round Pipe - live model, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/round-pipe.html`} data-product="roundPipe">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">16</span>
          {isMobileViewport ? <div className="csp-soon-placeholder">RP</div> : (
            // @ts-ignore custom element
            <model-viewer data-model-src={roundPipeModel} alt="Round Pipe molded plastic 3D model" loading="eager" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="80deg 76deg 92%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Round Pipe</div><div className="csp-ptag">Industrial Pipe - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 17 Fridge / Washing Machine Tray - live model, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=appliance-tray`} data-product="applianceTray">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">17</span>
          {isMobileViewport ? <div className="csp-soon-placeholder">FT</div> : (
            // @ts-ignore custom element
            <model-viewer data-model-src={applianceTrayModel} alt="Fridge / Washing Machine Tray molded plastic 3D model" loading="eager" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="28deg 74deg 108%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Fridge / Washing Machine Tray</div><div className="csp-ptag">Appliance Component - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 18 Motor Fan Blade - live model, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=motor-fan-blade`} data-product="motorFanBlade">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">18</span>
          {isMobileViewport ? <div className="csp-soon-placeholder">MB</div> : (
            // @ts-ignore custom element
            <model-viewer data-model-src={motorFanBladeModel} alt="12-blade industrial motor fan blade impeller 3D model" loading="eager" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="28deg 62deg 108%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Motor Fan Blade</div><div className="csp-ptag">Motor Component - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 19 Cup Container - live model, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=cup-container`} data-product="cupContainer">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">19</span>
          {isMobileViewport ? <div className="csp-soon-placeholder">CC</div> : (
            // @ts-ignore custom element
            <model-viewer data-model-src={cupContainerModel} alt="Cup Container food-packaging 3D model" loading="eager" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="20deg 78deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Cup Container</div><div className="csp-ptag">Food Packaging - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 20 Tooth Brush Collection - live model, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=tooth-brush`} data-product="toothBrush">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">20</span>
          {isMobileViewport ? <div className="csp-soon-placeholder">TB</div> : (
            // @ts-ignore custom element
            <model-viewer data-model-src={toothBrushModel} alt="Tooth Brush Collection personal-care 3D model" loading="eager" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="20deg 78deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Tooth Brush Collection</div><div className="csp-ptag">Personal Care - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {pendingProducts.map(p => (
        <a
          key={p.slug}
          className="csp-pcard featured live"
          href={p.slug === 'round-pipe'
            ? `${basePath}/case-study/round-pipe.html`
            : `${basePath}/case-study/product.html?p=${p.slug}`}
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
