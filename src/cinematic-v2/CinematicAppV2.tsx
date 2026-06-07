import './foundation.css';
import { useEffect } from 'react';

import Nav from './sections/Nav';
import Hero from './sections/Hero';
import Origin from './sections/Origin';
import Conversion from './sections/Conversion';
import Material from './sections/Material';
import Showcase from './sections/Showcase';
import Comparison from './sections/Comparison';
import Applications from './sections/Applications';
import Proof from './sections/Proof';
import Consultation from './sections/Consultation';
import Footer from './sections/Footer';

export default function CinematicAppV2() {
  // Dismiss the static boot loader (#agg-wd-loader from index.html). The v1
  // path removes it via AggregationLoader; v2 has no aggregation intro, so
  // clear it on mount or it stays as a black overlay over the whole page.
  useEffect(() => {
    const el = document.getElementById('agg-wd-loader');
    if (!el) return;
    el.setAttribute('data-done', '');
    const t = setTimeout(() => el.remove(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="v2-root">
      <a className="v2-skip-link" href="#material">
        Skip to main content
      </a>
      <Nav />
      <main>
        <Hero />
        <Origin />
        <Conversion />
        <Material />
        <Showcase />
        <Comparison />
        <Applications />
        <Proof />
        <Consultation />
      </main>
      <Footer />
    </div>
  );
}
