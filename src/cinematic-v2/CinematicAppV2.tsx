import './foundation.css';

import Hero from './sections/Hero';
import Origin from './sections/Origin';
import Conversion from './sections/Conversion';
import Material from './sections/Material';
import Comparison from './sections/Comparison';
import Applications from './sections/Applications';
import Proof from './sections/Proof';
import Consultation from './sections/Consultation';
import Footer from './sections/Footer';

export default function CinematicAppV2() {
  return (
    <div className="v2-root">
      <a className="v2-skip-link" href="#material">
        Skip to main content
      </a>
      <main>
        <Hero />
        <Origin />
        <Conversion />
        <Material />
        <Comparison />
        <Applications />
        <Proof />
        <Consultation />
      </main>
      <Footer />
    </div>
  );
}
