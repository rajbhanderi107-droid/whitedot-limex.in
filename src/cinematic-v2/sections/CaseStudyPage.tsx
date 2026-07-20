import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Nav from './Nav';
import Footer from './Footer';
import { observeViewportModels, observeMobileModelPool, warmCaseStudyModelCache } from '../productModelPreload';
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
const lunchboxModel = `${basePath}/case-study/model/lunch-box.glb`;
const dairySweetContainerModel = `${basePath}/case-study/model/dairy-sweet-container-procedural.glb`;
const dairyRoundContainerModel = `${basePath}/case-study/model/D500_Bowl.glb`;
const rectangleContainerModel = `${basePath}/case-study/model/rectangle-container-d250.glb`;
const hook20mmModel = `${basePath}/case-study/model/product-15-g1-clip.glb`;
const roundPipeModel = `${basePath}/case-study/model/round-pipe-procedural.glb`;
const applianceTrayModel = `${basePath}/case-study/model/product-17-appliance-tray.glb`;
const motorFanBladeModel = `${basePath}/case-study/model/product-18-impeller.glb`;
const cupContainerModel = `${basePath}/case-study/model/product-19-cup-container.glb`;
const toothBrushModel = `${basePath}/case-study/model/product-20-toothbrush-collection.glb`;
const petrolPipeModel = `${basePath}/case-study/model/product-21-petrol-pipe.glb`;
const proteinContainerModel = `${basePath}/case-study/model/unbranded-tall-round-container.glb`;
const rectangleBoxModel = `${basePath}/case-study/model/product-23-rectangle-box.glb`;
const smallRoundBottleModel = `${basePath}/case-study/model/product-24-small-round-bottle.glb?v=bright-white-20260716`;
const saltBottleModel = `${basePath}/case-study/model/product-25-salt-bottle.glb`;
const lightWeightContainerModel = `${basePath}/case-study/model/unbranded-thin-wall-tray-photo-match.glb`;
const foodTrayDishModel = `${basePath}/case-study/model/product-27-food-tray-dish-photo-match.glb`;
const lightWeightDishModel = `${basePath}/case-study/model/product-28-thin-wall-circle-dish.glb`;
const dermicoolPowderBottleHref = `${basePath}/case-study/product.html?p=dermicool-powder-bottle`;
const dermicoolPowderBottleModel = `${basePath}/case-study/model/product-29-dermicool-powder-bottle.glb`;
const wovenThreadHref = `${basePath}/case-study/product.html?p=woven-thread`;
const wovenThreadModel = `${basePath}/case-study/model/product-30-woven-thread.glb`;
const childBottleHref = `${basePath}/case-study/product.html?p=child-bottle`;
const childBottleModel = `${basePath}/case-study/model/product-31-sippy-cup.glb`;
const waterTubHref = `${basePath}/case-study/product.html?p=bath-tumbler`;
const waterTubModel = `${basePath}/case-study/model/product-32-bath-tumbler.glb`;
const toiletSeatHref = `${basePath}/case-study/product.html?p=toilet-seat`;
const toiletSeatModel = `${basePath}/case-study/model/product-33-toilet-seat.glb`;
const nonWovenBagHref = `${basePath}/case-study/product.html?p=non-woven-bag`;
const nonWovenBagModel = `${basePath}/case-study/model/product-34-nonwoven-bag.glb`;
const courierBagHref = `${basePath}/case-study/product.html?p=courier-bag`;
const courierBagModel = `${basePath}/case-study/model/product-35-courier-bag.glb`;
type ProductKey = 'overview' | 'bobbin' | 'container' | 'motorCover' | 'aralditeContainer' | 'handWashBottle' | 'hardDish' | 'consilePipe' | 'soapStand' | 'foodOilCan' | 'dairyContainer' | 'lunchBox' | 'dairySweetContainer' | 'dairyRoundContainer' | 'rectangleContainer' | 'hook20mm' | 'roundPipe' | 'applianceTray' | 'motorFanBlade' | 'cupContainer' | 'toothBrush' | 'petrolPipe' | 'proteinContainer' | 'rectangleBox' | 'smallRoundBottle' | 'saltBottle' | 'lightWeightContainer' | 'foodTrayDish' | 'lightWeightDish' | 'dermicoolPowderBottle' | 'wovenThread' | 'childBottle' | 'waterTub' | 'toiletSeat' | 'nonWovenBag' | 'courierBag';

const productStats: Record<ProductKey, { value: ReactNode; label: string; green?: boolean }[]> = {
  overview: [
    { value: '20', label: 'Active Studies' },
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
    { value: '04', label: 'Adhesive Dispenser Container' },
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
    { value: '13', label: 'D500 Bowl' },
    { value: '3D', label: 'Interactive Model' },
    { value: 'D500', label: 'Dairy Bowl' },
    { value: 'Live', label: 'Product 13', green: true },
  ],
  rectangleContainer: [
    { value: '14', label: 'D-250 Container' },
    { value: '250×190', label: 'mm Lid Envelope' },
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
  petrolPipe: [
    { value: '21', label: 'Petrol Pipe' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 21', green: true },
  ],
  proteinContainer: [
    { value: '22', label: 'Protein Container' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 22', green: true },
  ],
  rectangleBox: [
    { value: '23', label: 'Rectangle Container' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 23', green: true },
  ],
  smallRoundBottle: [
    { value: '24', label: 'Small Round Bottle' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 24', green: true },
  ],
  saltBottle: [
    { value: '25', label: 'Salt Bottle' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 25', green: true },
  ],
  lightWeightContainer: [
    { value: '26', label: 'Light Weight Container' },
    { value: '3D', label: 'Photo-Matched' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 26', green: true },
  ],
  foodTrayDish: [
    { value: '27', label: 'Food Tray Dish' },
    { value: '3D', label: 'Interactive Model' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 27', green: true },
  ],
  lightWeightDish: [
    { value: '28', label: 'Thin Wall Circle Dish' },
    { value: '3D', label: 'Interactive Model' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 28', green: true },
  ],
  wovenThread: [
    { value: '30', label: 'Woven Thread' },
    { value: '3D', label: 'Interactive Model' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 30', green: true },
  ],
  childBottle: [
    { value: '31', label: 'Child Bottle' },
    { value: '3D', label: 'Interactive Model' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 31', green: true },
  ],
  waterTub: [
    { value: '32', label: 'Bath Tumbler' },
    { value: '3D', label: 'Interactive Model' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 32', green: true },
  ],
  toiletSeat: [
    { value: '33', label: 'Toilet Seat' },
    { value: '3D', label: 'Interactive Model' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 33', green: true },
  ],
  nonWovenBag: [
    { value: '34', label: 'Non Woven Bag' },
    { value: '3D', label: 'Interactive Model' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 34', green: true },
  ],
  courierBag: [
    { value: '35', label: 'Courier Bag' },
    { value: '3D', label: 'Interactive Model' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 35', green: true },
  ],
  dermicoolPowderBottle: [
    { value: '29', label: 'Powder Bottle' },
    { value: '3D', label: 'Interactive Model' },
    { value: 'Pending', label: 'Verified Specs' },
    { value: 'Live', label: 'Product 29', green: true },
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
  const [mobileActive, setMobileActive] = useState<Set<string>>(() => new Set());
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

    // ── Inject model-viewer everywhere — model-viewer 4.x shares one WebGL
    // context across instances and observeViewportModels() below staggers GLB
    // activation through a concurrency-limited queue, so this is safe on mobile
    // too as long as the marquee's continuous per-frame layout/animation work
    // (the actual mobile-crash cause, see below) stays off. ──
    if (!customElements.get('model-viewer')) {
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
    const stopViewportModels = observeViewportModels(grid);
    const stopMobilePool = isMobileViewport ? observeMobileModelPool(grid, setMobileActive) : undefined;
    // Only warm the handful of cards visible above the fold on load — the
    // full page has 27 models (one is 15MB) and firing warmCaseStudyModelCache
    // with all of them fetched every GLB's raw bytes at once via priority:'high'
    // fetch(), 50ms after mount, regardless of scroll position. That flooded
    // the network with ~50MB of concurrent high-priority requests and froze
    // the tab on load. observeViewportModels' IntersectionObserver + its
    // concurrency-limited activation queue already handles the rest as the
    // user scrolls the marquee — same pattern as the homepage embed
    // (CaseStudyFeature.tsx).
    const product13Warmup = window.setTimeout(
      () => warmCaseStudyModelCache([bobbinModel, containerModel, motorCoverModel]),
      900,
    );

    let scrollX  = 0;
    const speed  = 0.65;
    let paused   = false;

    grid.addEventListener('mouseenter', () => { paused = true; });
    grid.addEventListener('mouseleave', () => { paused = false; });

    const cardEls = [...grid.querySelectorAll<HTMLElement>('.csp-pcard')];
    cardEls.forEach((c, i) => c.style.setProperty('--ci', String(Math.min(i, 8))));

    // Scroll-triggered staggered entrance for the card grid — one-shot.
    if ('IntersectionObserver' in window) {
      const revealIO = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            section!.classList.add('csp-inview');
            revealIO.disconnect();
          }
        },
        { threshold: 0.1 },
      );
      revealIO.observe(section);
    } else {
      section.classList.add('csp-inview');
    }

    function applyCardTransforms() {
      const sRect   = section!.getBoundingClientRect();
      const centerX = sRect.left + sRect.width / 2;
      const halfW   = sRect.width * 0.5;
      let nearestProduct: ProductKey | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      // ── READ PASS ── measure all cards before any style write. Interleaving
      // getBoundingClientRect() with transform writes forced one synchronous
      // reflow per card every frame — the marquee's main-thread jank. Batch
      // reads, then writes: one reflow per frame instead of one per card.
      const offsets = cardEls.map((c) => {
        const r  = c.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        return Math.max(-1.6, Math.min(1.6, (cx - centerX) / halfW));
      });

      // ── WRITE PASS ── no layout reads in this loop.
      cardEls.forEach((c, i) => {
        const t    = offsets[i];
        const absT = Math.abs(t);
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

    // The coverflow marquee's RAF loop never paused (this page has no
    // visibility gate) and its read pass walked ~70 duplicated-for-looping
    // cards' getBoundingClientRect() every frame, forever — that continuous
    // main-thread + compositor load, combined with backdrop-filter GPU layers,
    // is what crashed mobile Safari ("A problem repeatedly occurred"), even
    // with model-viewer disabled. Skip the marquee loop on mobile entirely —
    // the grid renders once, statically, in --all mode (see className below).
    const startTimer = isMobileViewport
      ? 0
      : window.setTimeout(() => { rafRef.current = requestAnimationFrame(tick); }, 80);

    // ── Mouse-tracking glow (desktop only) ──
    if (!isMobileViewport) {
      document.querySelectorAll<HTMLElement>('.csp-pcard.live').forEach(c => {
        const glow = c.querySelector<HTMLElement>('.csp-pglow');
        if (!glow) return;
        c.addEventListener('mouseenter', () => {
          const product = c.dataset.product as ProductKey | undefined;
          if (product === 'bobbin' || product === 'container' || product === 'motorCover' || product === 'aralditeContainer' || product === 'handWashBottle' || product === 'hardDish' || product === 'consilePipe' || product === 'soapStand' || product === 'foodOilCan' || product === 'dairyContainer' || product === 'lunchBox' || product === 'dairySweetContainer' || product === 'dairyRoundContainer' || product === 'rectangleContainer' || product === 'hook20mm' || product === 'roundPipe' || product === 'applianceTray' || product === 'motorFanBlade' || product === 'cupContainer' || product === 'petrolPipe' || product === 'proteinContainer' || product === 'rectangleBox' || product === 'smallRoundBottle' || product === 'saltBottle' || product === 'lightWeightContainer' || product === 'foodTrayDish' || product === 'lightWeightDish' || product === 'dermicoolPowderBottle' || product === 'wovenThread' || product === 'childBottle' || product === 'waterTub' || product === 'toiletSeat' || product === 'nonWovenBag' || product === 'courierBag') setActiveProductKey(product);
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
      stopMobilePool?.();
      window.clearTimeout(product13Warmup);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(startTimer);
    };
  }, [setActiveProductKey]);

  // Product cards — rendered twice for infinite scroll (desktop only; mobile
  // renders the list once, see the isMobileViewport-gated duplication below).
  // Static markup with zero dependency on activeProduct/allProductsOpen — memoized
  // so the RAF-driven setActiveProductKey() calls (fired every time the marquee's
  // nearest-to-center card changes, i.e. continuously while scrolling) don't force
  // React to rebuild/reconcile ~54 <model-viewer> elements on every frame-adjacent
  // state update on desktop. On mobile there's no RAF loop, so re-running this
  // memo when mobileActive changes (a handful of times as the user scrolls,
  // not per-frame) is cheap — that's what lets the LRU model-viewer pool
  // actually mount/unmount cards instead of leaving 35 mounted forever.
  const cards = useMemo(() => (
    <>
      {/* 01 Bobbin — live */}
      <a className="csp-pcard featured live" href={bobbinHref} data-product="bobbin">
        <div className="csp-border-beam" />
        <div className="csp-pglass" />
        <div className="csp-pglow" />
        <div className="csp-pmedia">
          <span className="csp-pidx">01</span>
          {(!isMobileViewport || mobileActive.has('bobbin')) ? (
            // @ts-ignore custom element
            <model-viewer
              data-model-src={bobbinModel}
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
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
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

      {/* 02 — coming soon */}
      <a className="csp-pcard featured live" href={containerHref} data-product="container">
        <div className="csp-border-beam" />
        <div className="csp-pglass" />
        <div className="csp-pglow" />
        <div className="csp-pmedia">
          <span className="csp-pidx">02</span>
          {(!isMobileViewport || mobileActive.has('container')) ? (
            // @ts-ignore custom element
            <model-viewer
              data-model-src={containerModel}
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
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
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
          {(!isMobileViewport || mobileActive.has('motorCover')) ? (
            // @ts-ignore custom element
            <model-viewer
              data-model-src={motorCoverModel}
              poster={motorCoverPoster}
              alt="Moter Cover - black vented motor cover 3D model"
              loading="lazy"
              interaction-prompt="none"
              shadow-intensity="0"
              exposure="1.16"
              tone-mapping="neutral"
              environment-image="neutral"
              camera-orbit="25deg 78deg 112%"
              style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
            />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
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
      {/* 04 Adhesive Dispenser Container - live */}
      <a className="csp-pcard featured live" href={aralditeHref} data-product="aralditeContainer">
        <div className="csp-border-beam" />
        <div className="csp-pglass" />
        <div className="csp-pglow" />
        <div className="csp-pmedia">
          <span className="csp-pidx">04</span>
          {(!isMobileViewport || mobileActive.has('aralditeContainer')) ? (
            // @ts-ignore custom element
            <model-viewer
              data-model-src={aralditeModel}
              alt="Adhesive Dispenser Container - LIMEX adhesive dispenser bottle 3D model"
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
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span className="csp-pfeatured">New Study</span>
            </div>
            <div className="csp-pname">Adhesive Dispenser Container</div>
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
          {(!isMobileViewport || mobileActive.has('handWashBottle')) ? (
            // @ts-ignore custom element
            <model-viewer
              data-model-src={handWashModel}
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
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
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
          {(!isMobileViewport || mobileActive.has('hardDish')) ? (
            // @ts-ignore custom element
            <model-viewer
              data-model-src={hardDishModel}
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
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
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
          {(!isMobileViewport || mobileActive.has('consilePipe')) ? (
            // @ts-ignore custom element
            <model-viewer
              data-model-src={consilePipeModel}
              alt="Concealed Pipe - black rigid conduit pipe with blue stripe and embossed ISI marking 3D model"
              loading="lazy"
              interaction-prompt="none"
              shadow-intensity="0"
              exposure="1.15"
              tone-mapping="neutral"
              environment-image="neutral"
              camera-orbit="80deg 76deg 60%"
              style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
            />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
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
          {(!isMobileViewport || mobileActive.has('soapStand')) ? (
            // @ts-ignore custom element
            <model-viewer
              data-model-src={soapStandModel}
              alt="Soap Stand - covered soap dish with knit-embossed lid, bow and drain insert 3D model"
              loading="lazy"
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
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
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
          {(!isMobileViewport || mobileActive.has('foodOilCan')) ? (
            // @ts-ignore custom element
            <model-viewer
              data-model-src={foodOilCanModel}
              alt="Food Oil Can - wide offset-cap oil jug with moulded handle 3D model"
              loading="lazy"
              interaction-prompt="none"
              shadow-intensity="0.9"
              shadow-softness="0.8"
              exposure="1.0"
              tone-mapping="neutral"
              environment-image="neutral"
              camera-orbit="22deg 72deg 108%"
              style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
            />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
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
          {(!isMobileViewport || mobileActive.has('dairyContainer')) ? (
            // @ts-ignore custom element
            <model-viewer
              data-model-src={dairyContainerModel}
              alt="Dairy Products Container - white round dairy tub 3D model"
              loading="lazy"
              interaction-prompt="none"
              shadow-intensity="0.9"
              shadow-softness="0.8"
              exposure="1.0"
              tone-mapping="neutral"
              environment-image="neutral"
              camera-orbit="22deg 76deg 108%"
              style={{ width: '100%', height: '100%', background: 'transparent', outline: 'none', pointerEvents: 'none' }}
            />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
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

      {/* 11 Lunch Box - live */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=lunch-box`} data-product="lunchBox">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">11</span>
          {(!isMobileViewport || mobileActive.has('lunchBox')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={lunchboxModel} alt="Lunch Box mini bento container 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.9" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="38deg 68deg 108%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Lunch Box</div><div className="csp-ptag">Mini Bento Container - Visual Reference</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 12 Dairy Sweet Container - live */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=dairy-sweet-container`} data-product="dairySweetContainer">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">12</span>
          {(!isMobileViewport || mobileActive.has('dairySweetContainer')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={dairySweetContainerModel} alt="Dairy Sweet Container D-500 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.75" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="legacy" camera-orbit="18deg 76deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Dairy Sweet Container</div><div className="csp-ptag">Compact PP Container - Smaller Than Product 14</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Food-grade PP</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 13 D500 Bowl - live */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=dairy-round-container`} data-product="dairyRoundContainer">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">13</span>
          {(!isMobileViewport || mobileActive.has('dairyRoundContainer')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={dairyRoundContainerModel} alt="D500 Bowl 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.9" shadow-softness="0.8" exposure="1.08" tone-mapping="neutral" environment-image="neutral" camera-orbit="18deg 72deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">D500 Bowl</div><div className="csp-ptag">Dairy Packaging - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 14 D-250 Rectangle Container - live */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=rectangle-container`} data-product="rectangleContainer">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">14</span>
          {(!isMobileViewport || mobileActive.has('rectangleContainer')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={rectangleContainerModel} alt="D-250 rectangular container 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.9" shadow-softness="0.75" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="18deg 70deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">D-250 Container</div><div className="csp-ptag">One-Piece Molded Plastic Container - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Photo-matched geometry</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 15 20 mm Hook — live (newest); shown in numeric sequence after 14 */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=20mm-hook`} data-product="hook20mm">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">15</span>
          {(!isMobileViewport || mobileActive.has('hook20mm')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={hook20mmModel} alt="20 mm hook plastic 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="0.85" tone-mapping="neutral" environment-image="neutral" camera-orbit="42deg 68deg 105%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">20 mm Hook</div><div className="csp-ptag">Hardware - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Photo-matched geometry</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 16 Round Pipe - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/round-pipe.html`} data-product="roundPipe">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">16</span>
          {(!isMobileViewport || mobileActive.has('roundPipe')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={roundPipeModel} alt="Round Pipe molded plastic 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="80deg 76deg 92%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Round Pipe</div><div className="csp-ptag">Industrial Pipe - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 17 Fridge / Washing Machine Tray - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=appliance-tray`} data-product="applianceTray">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">17</span>
          {(!isMobileViewport || mobileActive.has('applianceTray')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={applianceTrayModel} alt="Fridge / Washing Machine Tray molded plastic 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="28deg 74deg 108%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Fridge / Washing Machine Tray</div><div className="csp-ptag">Appliance Component - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 18 Motor Fan Blade - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=motor-fan-blade`} data-product="motorFanBlade">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">18</span>
          {(!isMobileViewport || mobileActive.has('motorFanBlade')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={motorFanBladeModel} alt="12-blade industrial motor fan blade impeller 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="28deg 62deg 108%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Motor Fan Blade</div><div className="csp-ptag">Motor Component - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 19 Cup Container - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=cup-container`} data-product="cupContainer">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">19</span>
          {(!isMobileViewport || mobileActive.has('cupContainer')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={cupContainerModel} alt="Cup Container food-packaging 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="20deg 78deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Cup Container</div><div className="csp-ptag">Food Packaging - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 20 Tooth Brush Collection - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=tooth-brush`} data-product="toothBrush">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">20</span>
          {(!isMobileViewport || mobileActive.has('toothBrush')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={toothBrushModel} alt="Tooth Brush Collection personal-care 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="20deg 78deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Tooth Brush Collection</div><div className="csp-ptag">Personal Care - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 21 Petrol Pipe - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=petrol-pipe`} data-product="petrolPipe">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">21</span>
          {(!isMobileViewport || mobileActive.has('petrolPipe')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={petrolPipeModel} alt="Petrol Pipe automotive 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="20deg 78deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Petrol Pipe</div><div className="csp-ptag">Automotive Component - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 22 Protein Container - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=protein-container`} data-product="proteinContainer">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">22</span>
          {(!isMobileViewport || mobileActive.has('proteinContainer')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={proteinContainerModel} alt="Unbranded tall round protein-container 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="22deg 76deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Protein Container</div><div className="csp-ptag">Nutrition Packaging - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 23 Rectangle Container - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=rectangle-box`} data-product="rectangleBox">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">23</span>
          {(!isMobileViewport || mobileActive.has('rectangleBox')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={rectangleBoxModel} alt="Rectangle Container general-packaging 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="18deg 70deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Rectangle Container</div><div className="csp-ptag">General Packaging - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 24 Small Round Bottle - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=small-round-bottle`} data-product="smallRoundBottle">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">24</span>
          {(!isMobileViewport || mobileActive.has('smallRoundBottle')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={smallRoundBottleModel} alt="Small round bottle general-packaging 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.9" shadow-softness="0.8" exposure="1.25" tone-mapping="neutral" environment-image="legacy" camera-orbit="20deg 76deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Small Round Bottle</div><div className="csp-ptag">General Packaging - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 25 Salt Bottle - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=salt-bottle`} data-product="saltBottle">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">25</span>
          {(!isMobileViewport || mobileActive.has('saltBottle')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={saltBottleModel} alt="Salt Bottle food-packaging 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="20deg 76deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Salt Bottle</div><div className="csp-ptag">Food Packaging - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 26 Light Weight Container - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=light-weight-container`} data-product="lightWeightContainer">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">26</span>
          {(!isMobileViewport || mobileActive.has('lightWeightContainer')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={lightWeightContainerModel} alt="Light Weight Container general-packaging 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="24deg 74deg 110%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Light Weight Container</div><div className="csp-ptag">General Packaging - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 27 Food Tray Dish - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=food-tray-dish`} data-product="foodTrayDish">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">27</span>
          {(!isMobileViewport || mobileActive.has('foodTrayDish')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={foodTrayDishModel} alt="Food Tray Dish food-packaging 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="26deg 60deg 108%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Food Tray Dish</div><div className="csp-ptag">Food Packaging - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 28 Thin Wall Circle Dish - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={`${basePath}/case-study/product.html?p=light-weight-dish`} data-product="lightWeightDish">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">28</span>
          {(!isMobileViewport || mobileActive.has('lightWeightDish')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={lightWeightDishModel} alt="Thin Wall Circle Dish kitchenware 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="24deg 66deg 110%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Thin Wall Circle Dish</div><div className="csp-ptag">Kitchenware - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 29 Dermicool Powder Bottle - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={dermicoolPowderBottleHref} data-product="dermicoolPowderBottle">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">29</span>
          {(!isMobileViewport || mobileActive.has('dermicoolPowderBottle')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={dermicoolPowderBottleModel} alt="Powder Bottle personal-care 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="20deg 74deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Powder Bottle</div><div className="csp-ptag">Personal Care Packaging - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 30 Woven Thread - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={wovenThreadHref} data-product="wovenThread">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">30</span>
          {(!isMobileViewport || mobileActive.has('wovenThread')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={wovenThreadModel} alt="Woven Thread textile material 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="30deg 75deg 105%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Woven Thread</div><div className="csp-ptag">Textile Material - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 31 Child Bottle - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={childBottleHref} data-product="childBottle">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">31</span>
          {(!isMobileViewport || mobileActive.has('childBottle')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={childBottleModel} alt="Child Bottle personal-care 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="22deg 76deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Child Bottle</div><div className="csp-ptag">Personal Care Packaging - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 32 Bath Tumbler - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={waterTubHref} data-product="waterTub">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">32</span>
          {(!isMobileViewport || mobileActive.has('waterTub')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={waterTubModel} alt="Bath Tumbler bathroom-accessory 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="24deg 74deg 112%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Bath Tumbler</div><div className="csp-ptag">Bathroom Accessory - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 33 Toilet Seat - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={toiletSeatHref} data-product="toiletSeat">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">33</span>
          {(!isMobileViewport || mobileActive.has('toiletSeat')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={toiletSeatModel} alt="Toilet Seat sanitaryware 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="22deg 72deg 115%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Toilet Seat</div><div className="csp-ptag">Sanitaryware - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 34 Non Woven Bag - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={nonWovenBagHref} data-product="nonWovenBag">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">34</span>
          {(!isMobileViewport || mobileActive.has('nonWovenBag')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={nonWovenBagModel} alt="Non Woven Bag packaging-textile 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="24deg 76deg 110%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Non Woven Bag</div><div className="csp-ptag">Packaging Textile - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

      {/* 35 Courier Bag - model live, verified composition pending */}
      <a className="csp-pcard featured live" href={courierBagHref} data-product="courierBag">
        <div className="csp-border-beam" /><div className="csp-pglass" /><div className="csp-pglow" />
        <div className="csp-pmedia"><span className="csp-pidx">35</span>
          {(!isMobileViewport || mobileActive.has('courierBag')) ? (
            // @ts-ignore custom element
            <model-viewer data-model-src={courierBagModel} alt="Courier Bag logistics-packaging 3D model" loading="lazy" interaction-prompt="none" shadow-intensity="0.85" shadow-softness="0.8" exposure="1.0" tone-mapping="neutral" environment-image="neutral" camera-orbit="24deg 76deg 110%" style={{ width:'100%', height:'100%', background:'transparent', outline:'none', pointerEvents:'none' }} />
          ) : (
            <div className="csp-soon-placeholder" aria-hidden="true">3D</div>
          )}
        </div>
        <div className="csp-pinfo"><div><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="csp-pfeatured">New Model</span></div><div className="csp-pname">Courier Bag</div><div className="csp-ptag">Logistics Packaging - Interactive 3D Model</div><div className="csp-pbar"><span style={{flex:100,height:'100%',background:'var(--cs-green)',display:'block'}} /></div><div className="csp-pbarlabels"><span className="csp-pdot pp" /><span className="csp-pblabel">Material spec pending</span></div></div><span className="csp-pgo">-&gt;</span></div>
      </a>

    </>
  ), [mobileActive]);

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
            <div className={`csp-grid-section${(allProductsOpen || isMobileViewport) ? ' csp-grid-section--all' : ''}`} ref={sectionRef}>
              <div className="csp-lens-wrap">
                <div className="csp-pgrid" ref={gridRef}>
                  {cards}
                  {!allProductsOpen && !isMobileViewport && cards}
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
