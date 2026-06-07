import './Showcase.css';
import { useReveal } from '../motion';

/**
 * Showcase — Frame 05. Carries V1's "Future Advertisement Showcase" copy
 * (MaterialCore.tsx) verbatim, now wired to the Higgsfield launch-film loop
 * generated for the green studio theme.
 */
export default function Showcase() {
  const head = useReveal<HTMLDivElement>();
  const frame = useReveal<HTMLDivElement>({ threshold: 0.15 });

  return (
    <section className="v2sc" id="material-core" aria-labelledby="v2sc-title">
      <div className="v2sc-inner">
        <div className="v2sc-head v2-reveal" ref={head.ref}>
          <p className="v2-eyebrow">Future Advertisement Showcase</p>
          <h2 id="v2sc-title" className="v2sc-title">
            Watch the Future of Sustainable Materials
          </h2>
          <p className="v2sc-sub">
            A cinematic look at how carbon innovation becomes premium material
            possibility.
          </p>
        </div>

        <div className="v2sc-frame v2-reveal" ref={frame.ref}>
          <span className="v2sc-reflection" aria-hidden="true" />
          <video
            className="v2sc-media"
            src="/assets/limex-launch-film.mp4"
            poster="/assets/limex-launch-poster.png"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>

        <p className="v2sc-caption v2-reveal">
          From captured carbon to next-generation material innovation.
        </p>
      </div>
    </section>
  );
}
