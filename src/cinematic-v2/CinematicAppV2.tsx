import './foundation.css';

import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { warmPublicBackend } from '../shared/publicApi';
import Nav from './sections/Nav';
import Hero from './sections/Hero';
import Footer from './sections/Footer';
import './premium-light.css';
import './section-fx.css';

/* X-WD-BEGIN aggregation */
const AggregationLoader = lazy(() =>
  import('../aggregation-wd').then((module) => ({ default: module.AggregationLoader })),
);
/* X-WD-END aggregation */

/* X-WD-BEGIN continuity */
const ContinuityShell = lazy(() =>
  import('../continuity-wd').then((module) => ({ default: module.ContinuityShell })),
);
/* X-WD-END continuity */

/* X-WD-BEGIN scroll-progress */
import { ScrollProgress } from '../shared/ScrollProgress';
/* X-WD-END scroll-progress */

/* X-WD-BEGIN assistant */
const AssistantShell = lazy(() =>
  import('../assistant-wd').then((module) => ({ default: module.AssistantShell })),
);
/* X-WD-END assistant */

const MaterialStory = lazy(() => import('./sections/MaterialStory'));
const PelletGalaxy = lazy(() => import('./sections/PelletGalaxy'));
const Showcase = lazy(() => import('./sections/Showcase'));
const LimexDetail = lazy(() => import('./sections/LimexDetail'));
const Comparison = lazy(() => import('./sections/Comparison'));
const Applications = lazy(() => import('./sections/Applications'));
const CaseStudyFeature = lazy(() => import('./sections/CaseStudyFeature'));
const CaseStudyPage = lazy(() => import('./sections/CaseStudyPage'));
const Consultation = lazy(() => import('./sections/Consultation'));
const GlobalImpact = lazy(() => import('./sections/GlobalImpact'));

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash);
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

function LazySectionFallback() {
  return <div aria-hidden="true" style={{ minHeight: 1 }} />;
}

function LazySection({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LazySectionFallback />}>{children}</Suspense>;
}

function dismissStaticPublicLoader() {
  const loader = document.getElementById('agg-wd-loader');
  if (!loader || loader.hasAttribute('data-maintenance')) return;
  loader.setAttribute('data-done', '');
  document.body.removeAttribute('aria-busy');
  window.setTimeout(() => loader.remove(), 450);
}

export default function CinematicAppV2() {
  const route = useHashRoute();
  const normalizedRoute = route.replace(/^#/, '').replace(/^\/+/, '');
  const isCaseStudyPage = normalizedRoute === 'case-studies';

  // Wake the backend while the visitor is still reading the hero, so the
  // first form submit / assistant message never waits on a cold start.
  useEffect(() => {
    const t = window.setTimeout(warmPublicBackend, 3_000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isCaseStudyPage) {
      dismissStaticPublicLoader();
    }
  }, [isCaseStudyPage]);

  if (isCaseStudyPage) {
    return (
      <Suspense fallback={<LazySectionFallback />}>
        <CaseStudyPage />
      </Suspense>
    );
  }

  return (
    <>
      {/* X-WD-BEGIN aggregation */}
      <Suspense fallback={null}>
        <AggregationLoader />
      </Suspense>
      {/* X-WD-END aggregation */}

      <div className="v2-root">
        {/* X-WD-BEGIN scroll-progress */}
        <ScrollProgress />
        {/* X-WD-END scroll-progress */}

        <a className="v2-skip-link" href="#material">
          Skip to main content
        </a>
        <Nav />
        <main>
          <Hero />
          <LazySection>
            <MaterialStory />
          </LazySection>
          {/* X-WD-BEGIN pellet-galaxy */}
          <LazySection>
            <PelletGalaxy />
          </LazySection>
          {/* X-WD-END pellet-galaxy */}
          <LazySection>
            <Showcase />
          </LazySection>
          <LazySection>
            <LimexDetail />
          </LazySection>
          <LazySection>
            <Comparison />
          </LazySection>
          <LazySection>
            <Applications />
          </LazySection>
          <LazySection>
            <CaseStudyFeature />
          </LazySection>
          <LazySection>
            <Consultation />
          </LazySection>
          <LazySection>
            <GlobalImpact />
          </LazySection>
        </main>
        <Footer />
      </div>

      {/* X-WD-BEGIN continuity */}
      <Suspense fallback={null}>
        <ContinuityShell />
      </Suspense>
      {/* X-WD-END continuity */}

      {/* X-WD-BEGIN assistant */}
      <Suspense fallback={null}>
        <AssistantShell />
      </Suspense>
      {/* X-WD-END assistant */}
    </>
  );
}
