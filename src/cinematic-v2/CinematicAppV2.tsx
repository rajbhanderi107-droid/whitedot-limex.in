import './foundation.css';

import { useEffect } from 'react';
import { warmPublicBackend } from '../cinematic/publicApi';
import Nav from './sections/Nav';
import Hero from './sections/Hero';
import MaterialStory from './sections/MaterialStory';
import Showcase from './sections/Showcase';
import LimexDetail from './sections/LimexDetail';
import Comparison from './sections/Comparison';
import Applications from './sections/Applications';
import News from './sections/News';
import Consultation from './sections/Consultation';
import GlobalImpact from './sections/GlobalImpact';
import Footer from './sections/Footer';
import './premium-light.css';
import './section-fx.css';

/* X-WD-BEGIN aggregation */
import { AggregationLoader } from '../aggregation-wd';
/* X-WD-END aggregation */

/* X-WD-BEGIN continuity */
import { ContinuityShell } from '../continuity-wd';
/* X-WD-END continuity */

/* X-WD-BEGIN scroll-progress */
import { ScrollProgress } from '../cinematic/ScrollProgress';
/* X-WD-END scroll-progress */

/* X-WD-BEGIN assistant */
import { AssistantShell } from '../assistant-wd';
/* X-WD-END assistant */

export default function CinematicAppV2() {
  // Wake the backend while the visitor is still reading the hero, so the
  // first form submit / assistant message never waits on a cold start.
  useEffect(() => {
    const t = window.setTimeout(warmPublicBackend, 3_000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      {/* X-WD-BEGIN aggregation */}
      <AggregationLoader />
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
          <MaterialStory />
          <Showcase />
          <LimexDetail />
          <Comparison />
          <Applications />
          <News />
          <Consultation />
          <GlobalImpact />
        </main>
        <Footer />
      </div>

      {/* X-WD-BEGIN continuity */}
      <ContinuityShell />
      {/* X-WD-END continuity */}

      {/* X-WD-BEGIN assistant */}
      <AssistantShell />
      {/* X-WD-END assistant */}
    </>
  );
}
