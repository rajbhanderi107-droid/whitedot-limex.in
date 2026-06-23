import './foundation.css';

import { Suspense, lazy, useEffect, useState } from 'react';
import { warmPublicBackend } from '../cinematic/publicApi';
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
import { ScrollProgress } from '../cinematic/ScrollProgress';
/* X-WD-END scroll-progress */

/* X-WD-BEGIN assistant */
const AssistantShell = lazy(() =>
  import('../assistant-wd').then((module) => ({ default: module.AssistantShell })),
);
/* X-WD-END assistant */

const MaterialStory = lazy(() => import('./sections/MaterialStory'));
const Showcase = lazy(() => import('./sections/Showcase'));
const LimexDetail = lazy(() => import('./sections/LimexDetail'));
const Comparison = lazy(() => import('./sections/Comparison'));
const Applications = lazy(() => import('./sections/Applications'));
const CaseStudyFeature = lazy(() => import('./sections/CaseStudyFeature'));
const Consultation = lazy(() => import('./sections/Consultation'));
const GlobalImpact = lazy(() => import('./sections/GlobalImpact'));
const NewsPage = lazy(() => import('./sections/NewsPage'));

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

export default function CinematicAppV2() {
  const route = useHashRoute();
  const isNewsPage = route.replace(/^#/, '').replace(/^\/+/, '') === 'news';

  // Wake the backend while the visitor is still reading the hero, so the
  // first form submit / assistant message never waits on a cold start.
  useEffect(() => {
    const t = window.setTimeout(warmPublicBackend, 3_000);
    return () => window.clearTimeout(t);
  }, []);

  if (isNewsPage) {
    return (
      <Suspense fallback={<LazySectionFallback />}>
        <NewsPage />
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
          <Suspense fallback={<LazySectionFallback />}>
            <MaterialStory />
            <Showcase />
            <LimexDetail />
            <Comparison />
            <Applications />
            <CaseStudyFeature />
            <Consultation />
            <GlobalImpact />
          </Suspense>
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
